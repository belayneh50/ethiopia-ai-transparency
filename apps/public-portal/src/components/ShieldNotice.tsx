import { Dual } from "./Dual";

export function ShieldNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "shield compact" : "shield"}>
      <span>ⓘ</span>
      <p>
        <strong>
          <Dual en="Authorized human review only" am="ፈቃድ ላለው የሰው ግምገማ ብቻ" />
        </strong>
        {!compact && (
          <>
            <br />
            <Dual en="This signal is not proof of wrongdoing." am="ይህ ምልክት የጥፋተኝነት ማስረጃ አይደለም።" />
          </>
        )}
      </p>
    </div>
  );
}
