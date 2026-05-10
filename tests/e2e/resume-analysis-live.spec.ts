import { expect, test } from "@playwright/test";

function createMinimalPdfBuffer(): Buffer {
  const pdf = `%PDF-1.1\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n4 0 obj\n<< /Length 81 >>\nstream\nBT\n/F1 18 Tf\n72 720 Td\n(Test Resume - QA Candidate with React Node TypeScript achievements) Tj\nET\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000062 00000 n \n0000000117 00000 n \n0000000246 00000 n \n0000000380 00000 n \ntrailer\n<< /Root 1 0 R /Size 6 >>\nstartxref\n450\n%%EOF`;
  return Buffer.from(pdf, "utf-8");
}

test("upload and render analysis dashboard on live site", async ({ page }) => {
  const runtimeErrors: string[] = [];

  page.on("pageerror", (error) => {
    runtimeErrors.push(error.message);
  });

  await page.goto("/?t=" + Date.now(), { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Resume Upload" })).toBeVisible();

  await page.locator('input[type="file"]').setInputFiles({
    name: "resume-test.pdf",
    mimeType: "application/pdf",
    buffer: createMinimalPdfBuffer(),
  });

  const analyzeButton = page.getByRole("button", { name: "Analyze Resume" });
  await expect(analyzeButton).toBeEnabled();
  await analyzeButton.click();

  await expect(page.getByRole("heading", { name: "Resume Intelligence" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Export PDF" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Actionable Next Steps" })).toBeVisible();

  const animatedCounterRuntimeErrors = runtimeErrors.filter((msg) =>
    msg.includes("AnimatedCounter") || msg.includes("is not defined")
  );

  expect(animatedCounterRuntimeErrors).toEqual([]);
});
