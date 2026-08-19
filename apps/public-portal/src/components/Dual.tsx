export function Dual({ en, am, separator = " · " }: { en: string; am: string; separator?: string }) {
  return (
    <>
      <span className="en-only">{en}</span>
      <span className="dual-separator">{separator}</span>
      <span className="am-only">{am}</span>
    </>
  );
}
