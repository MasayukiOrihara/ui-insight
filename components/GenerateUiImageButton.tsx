"use client";

type Props = {
  disabled?: boolean;
  loading?: boolean;
  onClick: () => Promise<void> | void;
  label?: string;
};

export function GenerateUiImageButton({
  disabled,
  loading,
  onClick,
  label = "現状UIの再現画像を生成",
}: Props) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      style={{
        marginTop: 12,
        padding: "8px 16px",
        borderRadius: 6,
        border: "1px solid #ccc",
        background: disabled ? "#eee" : "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {loading ? "生成中…" : label}
    </button>
  );
}
