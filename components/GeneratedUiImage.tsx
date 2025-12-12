"use client";

type Props = {
  src?: string | null; // data:image/png;base64,... を想定
  loading?: boolean;
  error?: string | null;
  title?: string;
};

export function GeneratedUiImage({ src, loading, error, title }: Props) {
  const canShow = !!src && !loading && !error;

  return (
    <div style={{ marginTop: 16 }}>
      {title ? <h3 style={{ margin: "8px 0" }}>{title}</h3> : null}

      {loading ? <p>画像を生成中…</p> : null}
      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      {canShow ? (
        <div style={{ display: "grid", gap: 8 }}>
          <img
            src={src}
            alt="generated-ui"
            style={{ maxWidth: "100%", border: "1px solid #ddd" }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <a href={src} download="ui-mock.png">
              ダウンロード
            </a>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(src);
                  alert("画像データURLをコピーしました");
                } catch {
                  alert("コピーに失敗しました（ブラウザ権限を確認）");
                }
              }}
            >
              Data URLをコピー
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
