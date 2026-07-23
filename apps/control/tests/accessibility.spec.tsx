import "@testing-library/jest-dom/vitest";

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { CommandAcknowledgement } from "@streamctrl/contracts";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { GraphicsWorkspace } from "../src/features/graphics/GraphicsWorkspace.js";

const accepted: CommandAcknowledgement = {
  accepted: true,
  commandId: "command-1" as never,
  resultingRevision: 0
};

function renderWorkspace() {
  return render(
    <GraphicsWorkspace
      graphics={{
        programRevision: 0,
        scorebug: null,
        lowerThird: null,
        updatedAt: "2026-07-23T18:00:00.000Z" as never
      }}
      onAllHide={vi.fn().mockResolvedValue(accepted)}
      onHide={vi.fn().mockResolvedValue(accepted)}
      onPreview={vi.fn().mockResolvedValue(accepted)}
      onTake={vi.fn().mockResolvedValue(accepted)}
    />
  );
}

describe("accesibilidad operativa", () => {
  it("permite recorrer los controles principales con teclado", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await user.tab();
    expect(screen.getByRole("button", { name: "Ocultar todos los gráficos" })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("button", { name: "Preparar marcador" })).toHaveFocus();

    expect(screen.getByLabelText("Nombre principal")).toHaveAttribute("maxlength", "120");
    expect(screen.getByLabelText("Función")).toHaveAttribute("maxlength", "160");
  });

  it("expresa estados y errores con texto, no únicamente con color", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await user.click(screen.getByRole("button", { name: "Previsualizar rótulo inferior" }));

    expect(screen.getByRole("status")).toHaveTextContent("El nombre principal es obligatorio");
    expect(screen.getByRole("heading", { name: "Program · LIMPIO" })).toBeVisible();
  });

  it("mantiene un foco visible de alto contraste", () => {
    const css = readFileSync(resolve("apps/control/src/styles.css"), "utf8");
    expect(css).toMatch(/:focus-visible/);
    expect(css).toMatch(/outline:\s*3px solid/);
  });
});
