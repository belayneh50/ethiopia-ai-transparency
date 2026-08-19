import { defineConfig, loadEnv, type Plugin, type PreviewServer, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import { adaptGeminiPayload, describeGeneratedGuidance, describeGeminiShape, extractGeneratedTexts } from "./src/geminiResponseAdapter.ts";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const MODEL_NAME = "gemini-1.5-flash";
type Server = ViteDevServer | PreviewServer;
type GeminiFailureClass = "credential" | "quota" | "model_or_endpoint" | "request_format" | "network" | "upstream" | "response_contract" | "proxy_validation" | "proxy_internal";

class GeminiProxyError extends Error {
  constructor(readonly classification: GeminiFailureClass) { super(classification); }
}

function geminiReviewProxy(apiKey: string): Plugin {
  const attach = (server: Server) => {
    server.middlewares.use("/api/gemini-review", async (request, response) => {
      response.setHeader("Content-Type", "application/json; charset=utf-8");
      if (request.method !== "POST") {
        response.statusCode = 405;
        response.end(JSON.stringify({ error: "Method not allowed" }));
        return;
      }
      if (!apiKey) {
        response.statusCode = 503;
        response.end(JSON.stringify({ error: "Gemini is not configured" }));
        return;
      }

      try {
        const chunks: Buffer[] = [];
        for await (const chunk of request) chunks.push(Buffer.from(chunk));
        const body = Buffer.concat(chunks).toString("utf8");
        const record = JSON.parse(body) as Record<string, unknown>;
        const reference = record.marketReference as Record<string, unknown> | undefined;
        const referenceFields = reference && [reference.count, reference.low, reference.median, reference.high, reference.recordQuantity, reference.recordUnitPrice, reference.differenceFromMedian, reference.percentFromMedian];
        if ((record.language !== "am" && record.language !== "en" && record.language !== "both") || typeof record.id !== "string" || !record.id.startsWith("SYN-ET-") || !reference || !referenceFields?.every(value => typeof value === "number" && Number.isFinite(value)) || typeof reference.count !== "number" || reference.count < 1 || reference.count > 5 || Buffer.byteLength(body) > 12_000) {
          throw new GeminiProxyError("proxy_validation");
        }
        const geminiInput = {
          language: record.language,
          id: record.id, item: record.item, category: record.category, buyer: record.buyer, supplier: record.supplier,
          value: record.value, date: record.date, status: record.status, daysOpen: record.daysOpen, bids: record.bids,
          signals: record.signals,
          marketReference: {
            count: reference.count, low: reference.low, median: reference.median, high: reference.high,
            recordQuantity: reference.recordQuantity, recordUnitPrice: reference.recordUnitPrice,
            differenceFromMedian: reference.differenceFromMedian, percentFromMedian: reference.percentFromMedian,
          },
        };
        const languageInstruction = record.language === "am"
          ? "Respond in Amharic only using only the Amharic fields in the response schema."
          : record.language === "en"
            ? "Respond in English only using only the English fields in the response schema."
            : "Respond bilingually with clearly separated professional English and Amharic content in their respective fields.";

        const prompt = `You provide optional, neutral review guidance for an authorized human reviewer of a SYNTHETIC procurement demonstration record. No real person, agency, supplier, confidential, biometric, or government data is present.

Do not produce a risk score, rating, accusation, suspicion, finding, verdict, fairness or bias assessment, wrongdoing or corruption determination, compliance conclusion, recommendation, or action. Do not infer facts or market conditions beyond the supplied synthetic fields. Explain that source documents and context must be checked by a human. Use neutral language and questions only.

Language requirement: ${languageInstruction}

The marketReference unit-price numbers were deterministically computed in the reviewer's browser solely from manually entered unit-price comparisons. The record unit price is its total value divided by the explicit quantity in its synthetic label. Accept those numbers as supplied; do not recalculate, invent, correct, or extend them. You do not know the listings or the source of any market price. Do not identify, attribute, search for, or claim access to price sources. Describe the range only as "reviewer-supplied market reference" and ask neutral questions about whether specifications, unit basis, condition, taxes, delivery, location, dates, and sources were verified by the authorized human reviewer.

Synthetic record JSON:
${JSON.stringify(geminiInput)}`;
        let upstream: Response;
        try { upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1, maxOutputTokens: 2400, responseMimeType: "application/json",
              thinkingConfig: { thinkingLevel: "minimal" },
              responseSchema: {
                type: "object",
                properties: record.language === "am" ? {
                  overviewAm: { type: "string" }, questionsAm: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 }, limitationsAm: { type: "string" },
                } : record.language === "en" ? {
                  overviewEn: { type: "string" }, questionsEn: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 }, limitationsEn: { type: "string" },
                } : {
                  overviewEn: { type: "string" }, overviewAm: { type: "string" },
                  questionsEn: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
                  questionsAm: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
                  limitationsEn: { type: "string" }, limitationsAm: { type: "string" },
                },
                required: record.language === "am" ? ["overviewAm", "questionsAm", "limitationsAm"] : record.language === "en" ? ["overviewEn", "questionsEn", "limitationsEn"] : ["overviewEn", "overviewAm", "questionsEn", "questionsAm", "limitationsEn", "limitationsAm"],
              },
            },
          }),
        }); } catch { throw new GeminiProxyError("network"); }
        if (!upstream.ok) {
          const classification: GeminiFailureClass = upstream.status === 401 || upstream.status === 403 ? "credential" : upstream.status === 404 ? "model_or_endpoint" : upstream.status === 429 ? "quota" : upstream.status === 400 ? "request_format" : "upstream";
          throw new GeminiProxyError(classification);
        }
        let payload: { candidates?: Array<{ content?: { parts?: Array<Record<string, unknown>> } }> };
        try { payload = await upstream.json() as typeof payload; } catch { throw new GeminiProxyError("response_contract"); }
        const shape = describeGeminiShape(payload);
        const texts = extractGeneratedTexts(payload);
        if (!texts.length) throw new GeminiProxyError("response_contract");
        let guidance;
        try { guidance = adaptGeminiPayload(payload, record.language as "am" | "en" | "both"); }
        catch {
          console.warn(`[gemini-review] generated shape: ${JSON.stringify(shape)}; guidance parts: ${JSON.stringify(texts.map(describeGeneratedGuidance))}`);
          throw new GeminiProxyError("response_contract");
        }
        response.statusCode = 200;
        response.end(JSON.stringify(guidance));
      } catch (error) {
        const classification = error instanceof GeminiProxyError ? error.classification : "proxy_internal";
        console.warn(`[gemini-review] safe failure classification: ${classification}`);
        response.statusCode = 502;
        response.end(JSON.stringify({ error: "Neutral Gemini guidance is unavailable", classification }));
      }
    });
  };
  return { name: "local-gemini-review-proxy", configureServer: attach, configurePreviewServer: attach };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname + "/../..", "");
  return {
    envDir: '../..',
    plugins: [react(), geminiReviewProxy(env.GEMINI_API_KEY || "")],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@ethiopia-ai/shared-types': path.resolve(__dirname, '../../packages/shared-types'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/api/v1'),
        },
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
  };
});
