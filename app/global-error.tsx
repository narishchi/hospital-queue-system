"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <main style={{ padding: "24px" }}>
          <h1>เกิดข้อผิดพลาดร้ายแรง</h1>

          <p>ขออภัย ระบบเกิดข้อผิดพลาดบางอย่าง</p>

          <button onClick={() => reset()}>
            ลองอีกครั้ง
          </button>
        </main>
      </body>
    </html>
  );
}