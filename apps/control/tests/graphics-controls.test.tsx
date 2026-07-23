import "@testing-library/jest-dom/vitest";

import type { CommandAcknowledgement, GraphicsState } from "@streamctrl/contracts";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  GraphicsWorkspace,
  type GraphicsWorkspaceProps
} from "../src/features/graphics/GraphicsWorkspace.js";

const accepted: CommandAcknowledgement = {
  accepted: true,
  commandId: "command-1" as never,
  resultingRevision: 1
};

function graphics(lowerThird: GraphicsState["lowerThird"] = null): GraphicsState {
  return {
    programRevision: lowerThird ? 1 : 0,
    scorebug: null,
    lowerThird,
    updatedAt: "2026-07-23T18:00:00.000Z" as never
  };
}

function props(overrides: Partial<GraphicsWorkspaceProps> = {}): GraphicsWorkspaceProps {
  return {
    graphics: graphics(),
    onPreview: vi.fn().mockResolvedValue(accepted),
    onTake: vi.fn().mockResolvedValue(accepted),
    onHide: vi.fn().mockResolvedValue(accepted),
    onAllHide: vi.fn().mockResolvedValue(accepted),
    ...overrides
  };
}

describe("graphics workspace", () => {
  it("does not take an incomplete lower third and explains what is missing", async () => {
    const user = userEvent.setup();
    const callbacks = props();
    render(<GraphicsWorkspace {...callbacks} />);

    await user.type(screen.getByLabelText("Nombre principal"), "Ana Pérez");
    await user.click(screen.getByRole("button", { name: "Previsualizar rótulo inferior" }));

    expect(screen.getByRole("status")).toHaveTextContent("La función es obligatoria");
    expect(callbacks.onPreview).not.toHaveBeenCalled();
  });

  it("keeps Program authoritative until the server snapshot changes", async () => {
    const user = userEvent.setup();
    const callbacks = props();
    const view = render(<GraphicsWorkspace {...callbacks} />);

    await user.type(screen.getByLabelText("Nombre principal"), "Ana Pérez");
    await user.type(screen.getByLabelText("Función"), "Comentarista");
    await user.click(screen.getByRole("button", { name: "Previsualizar rótulo inferior" }));
    await user.click(screen.getByRole("button", { name: "Tomar rótulo inferior" }));

    expect(callbacks.onTake).toHaveBeenCalledWith("lowerThird");
    expect(screen.getByTestId("program-lower-third")).toBeEmptyDOMElement();

    view.rerender(
      <GraphicsWorkspace
        {...callbacks}
        graphics={graphics({
          cueId: "cue-1" as never,
          type: "lowerThird",
          payload: { primaryText: "Ana Pérez", secondaryText: "Comentarista" },
          shownAt: "2026-07-23T18:01:00.000Z" as never
        })}
      />
    );
    expect(screen.getByTestId("program-lower-third")).toHaveTextContent("Ana Pérez");

    await user.click(screen.getByRole("button", { name: "Ocultar todos los gráficos" }));
    expect(callbacks.onAllHide).toHaveBeenCalledOnce();
  });
});
