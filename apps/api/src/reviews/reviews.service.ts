import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findByRecord(recordId: string) {
    const review = await this.prisma.geminiGuidance.findFirst({
      where: { recordId },
    });

    if (!review) return null;
    return review;
  }

  async requestGuidance(userId: string, recordId: string, language: string) {
    if (language !== 'am' && language !== 'en' && language !== 'both') {
      throw new NotFoundException('Invalid language');
    }

    const record = await this.prisma.record.findUnique({ where: { id: recordId } });
    if (!record) throw new NotFoundException('Record not found');

    const guidance = await this.prisma.geminiGuidance.findFirst({
      where: { recordId },
    });

    if (guidance) {
      await this.auditService.log({
        action: 'review',
        entityType: 'review',
        entityId: recordId,
        changes: { action: 'guidance_viewed' },
        performedBy: userId,
      });

      return guidance;
    }

    const fallback = this.buildFallbackGuidance(language);

    const created = await this.prisma.geminiGuidance.create({
      data: {
        recordId: record.id,
        language,
        ...fallback,
        source: 'fallback',
      },
    });

    await this.auditService.log({
      action: 'review',
      entityType: 'review',
      entityId: recordId,
      changes: { action: 'guidance_created', language, source: 'fallback' },
      performedBy: userId,
    });

    return created;
  }

  private buildFallbackGuidance(language: string) {
    if (language === 'am') {
      return {
        overviewAm: 'የGemini መመሪያ አሁን አይገኝም። በገምጋሚው የቀረቡ ማነጻጸሪያዎችና በአሳሹ የተሰላው የዋጋ ክልል ለሰው ግምገማ ይገኛሉ።',
        overviewEn: '',
        questionsAm: [
          'ዋጋውን፣ የውል ጊዜውን እና የቀረቡ ጨረታዎችን ብዛት የሚያብራሩት የትኞቹ የግዥ መነሻ ሰነዶች ናቸው?',
          'የማነጻጸሪያ መረጃዎቹ በብዛት፣ በዝርዝር መግለጫ እና በግዥ ወቅት ተመሳሳይ መሆናቸው ተረጋግጧል?',
          'ፈቃድ ያለው ገምጋሚ የመጨረሻ ማጠቃለያ ከመመዝገቡ በፊት ምን ተጨማሪ ዐውድ ማረጋገጥ አለበት?',
        ],
        questionsEn: [],
        limitationsAm: 'ይህ ተተኪ መመሪያ ፍትሃዊነትን፣ ጥፋትን፣ ህጋዊ ተገዢነትን ወይም የእውነተኛውን ገበያ ሁኔታ አይገመግምም፤ ምንም ዓይነት ውሳኔም አይመክርም።',
        limitationsEn: '',
      };
    }

    if (language === 'en') {
      return {
        overviewAm: '',
        overviewEn: 'Gemini guidance is unavailable. The reviewer-supplied comparisons and the browser-calculated range remain available for manual review.',
        questionsAm: [],
        questionsEn: [
          'Which source documents explain the price, timing, and number of bids?',
          'Are the comparison records genuinely similar in quantity, specification, and date?',
          'What additional context should an authorized reviewer verify before recording a conclusion?',
        ],
        limitationsAm: '',
        limitationsEn: 'This fallback does not evaluate fairness, wrongdoing, compliance, or real-world market conditions and does not recommend an action.',
      };
    }

    return {
      overviewAm: 'የGemini መመሪያ አሁን አይገኝም። በገምጋሚው የቀረቡ ማነጻጸሪያዎችና በአሳሹ የተሰላው የዋጋ ክልል ለሰው ግምገማ ይገኛሉ።',
      overviewEn: 'Gemini guidance is unavailable. The reviewer-supplied comparisons and the browser-calculated range remain available for manual review.',
      questionsAm: [
        'ዋጋውን፣ የውል ጊዜውን እና የቀረቡ ጨረታዎችን ብዛት የሚያብራሩት የትኞቹ የግዥ መነሻ ሰነዶች ናቸው?',
        'የማነጻጸሪያ መረጃዎቹ በብዛት፣ በዝርዝር መግለጫ እና በግዥ ወቅት ተመሳሳይ መሆናቸው ተረጋግጧል?',
        'ፈቃድ ያለው ገምጋሚ የመጨረሻ ማጠቃለያ ከመመዝገቡ በፊት ምን ተጨማሪ ዐውድ ማረጋገጥ አለበት?',
      ],
      questionsEn: [
        'Which source documents explain the price, timing, and number of bids?',
        'Are the comparison records genuinely similar in quantity, specification, and date?',
        'What additional context should an authorized reviewer verify before recording a conclusion?',
      ],
      limitationsAm: 'ይህ ተተኪ መመሪያ ፍትሃዊነትን፣ ጥፋትን፣ ህጋዊ ተገዢነትን ወይም የእውነተኛውን ገበያ ሁኔታ አይገመግምም፤ ምንም ዓይነት ውሳኔም አይመክርም።',
      limitationsEn: 'This fallback does not evaluate fairness, wrongdoing, compliance, or real-world market conditions and does not recommend an action.',
    };
  }
}