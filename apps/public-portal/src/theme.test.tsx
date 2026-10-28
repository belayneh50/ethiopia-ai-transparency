import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ThemeProvider, useTheme } from "./theme";

function Probe() {
  const { theme, toggleTheme } = useTheme();
  return <button onClick={toggleTheme} data-theme={theme}>toggle</button>;
}

describe("ThemeProvider", () => {
  it("defaults to light and exposes a toggle in non-browser environments", () => {
    const html = renderToStaticMarkup(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(html).toContain('data-theme="light"');
    expect(html).toContain("toggle");
  });
});
