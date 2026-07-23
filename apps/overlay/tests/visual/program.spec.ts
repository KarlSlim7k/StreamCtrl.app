import { expect, test } from "@playwright/test";

test("Program is transparent and graphics remain inside the five-percent safe area", async ({
  page
}, testInfo) => {
  test.skip(testInfo.project.name !== "overlay", "Overlay-only visual validation");
  await page.goto("/overlay/program");

  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor))
    .toBe("rgba(0, 0, 0, 0)");

  await page.evaluate(() => {
    const scorebug = document.createElement("div");
    scorebug.className = "scorebug";
    scorebug.dataset.visualTest = "safe-area";
    scorebug.textContent = "2H · LOC 2 · VIS 1 · 67:14";
    document.querySelector(".graphics-layer")?.append(scorebug);
  });

  const box = await page.locator('[data-visual-test="safe-area"]').boundingBox();
  expect(box).not.toBeNull();
  expect(box?.x).toBeGreaterThanOrEqual(96);
  expect(box?.y).toBeGreaterThanOrEqual(54);
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(1_824);
  expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(1_026);

  const image = await page.screenshot({ omitBackground: true });
  expect(image).toMatchSnapshot("program-safe-area.png");
});
