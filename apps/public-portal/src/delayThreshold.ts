export function getDelayThresholdCopy(daysOpen: number, threshold: number) {
  return {
    en: `This procurement has been active for ${daysOpen} days without final resolution, exceeding the ${threshold}-day review threshold.`,
    am: `ይህ ግዥ የመጨረሻ ውሳኔ ሳያገኝ ${daysOpen} ቀናት የቆየ ሲሆን፣ ይህም ከ${threshold} ቀናት የማሳያ ገደብ በላይ ነው።`,
  };
}
