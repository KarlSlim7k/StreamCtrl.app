import { expect, test } from "@playwright/test";

test("Preview, Take and all.hide remain explicit", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "control", "Control-only operator journey");
  await page.goto("/control/");

  await page.getByLabel("Nombre del equipo local").fill("Local");
  await page.getByLabel("Abreviatura del equipo local").fill("LOC");
  await page.getByLabel("Nombre del equipo visitante").fill("Visitante");
  await page.getByLabel("Abreviatura del equipo visitante").fill("VIS");
  await page.getByRole("button", { name: "Crear partido" }).click();
  await expect(page.getByRole("button", { name: "Sumar gol local" })).toBeVisible();

  await page.getByLabel("Nombre principal").fill("Ana Pérez");
  await page.getByLabel("Función").fill("Comentarista");
  await page.getByRole("button", { name: "Previsualizar rótulo inferior" }).click();

  await expect(page.getByTestId("preview-lower-third")).toContainText("Ana Pérez");
  await expect(page.getByTestId("program-lower-third")).toBeEmpty();

  await page.getByRole("button", { name: "Tomar rótulo inferior" }).click();
  await expect(page.getByTestId("program-lower-third")).toContainText("Ana Pérez");

  await page.getByRole("button", { name: "Ocultar todos los gráficos" }).click();
  await expect(page.getByTestId("program-lower-third")).toBeEmpty();
});
