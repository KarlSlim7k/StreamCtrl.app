export interface AnimationHandle {
  kill(): void;
}

interface RegisteredAnimation {
  animation: AnimationHandle;
  cleanup: () => void;
}

export class AnimationRegistry {
  readonly #animations = new Map<string, RegisteredAnimation>();

  register(id: string, animation: AnimationHandle, cleanup: () => void = () => undefined): void {
    this.interrupt(id);
    this.#animations.set(id, { animation, cleanup });
  }

  complete(id: string): void {
    const registered = this.#animations.get(id);
    if (!registered) {
      return;
    }
    registered.cleanup();
    this.#animations.delete(id);
  }

  interrupt(id: string): void {
    const registered = this.#animations.get(id);
    if (!registered) {
      return;
    }
    registered.animation.kill();
    registered.cleanup();
    this.#animations.delete(id);
  }

  interruptAll(): void {
    for (const id of [...this.#animations.keys()]) {
      this.interrupt(id);
    }
  }

  get activeCount(): number {
    return this.#animations.size;
  }
}

export function animationDuration(durationMs: number, reducedMotion: boolean): number {
  return reducedMotion ? 0 : Math.max(0, durationMs) / 1_000;
}
