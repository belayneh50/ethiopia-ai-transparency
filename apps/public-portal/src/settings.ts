export type ThresholdSettings = {
  price: number;          // ETB
  repeatSupplier: number; // Count
  delay: number;          // Days
};

export const DEFAULT_SETTINGS: ThresholdSettings = {
  price: 1_500_000,
  repeatSupplier: 2,
  delay: 30,
};