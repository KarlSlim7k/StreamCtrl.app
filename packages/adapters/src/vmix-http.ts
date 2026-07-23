export type VmixAdapterResult =
  | { ok: true; status: number }
  | {
      ok: false;
      code: "VMIX_DISABLED" | "VMIX_UNAVAILABLE" | "CIRCUIT_OPEN";
      message: string;
    };

export interface VmixHttpAdapterOptions {
  enabled: boolean;
  baseUrl: string;
  timeoutMs?: number;
  failureThreshold?: number;
  cooldownMs?: number;
  fetch?: typeof fetch;
  now?: () => number;
}

export class VmixHttpAdapter {
  readonly #enabled: boolean;
  readonly #baseUrl: URL;
  readonly #timeoutMs: number;
  readonly #failureThreshold: number;
  readonly #cooldownMs: number;
  readonly #fetch: typeof fetch;
  readonly #now: () => number;
  #failures = 0;
  #openedAt: number | null = null;

  constructor(options: VmixHttpAdapterOptions) {
    this.#enabled = options.enabled;
    this.#baseUrl = new URL(options.baseUrl);
    this.#timeoutMs = options.timeoutMs ?? 750;
    this.#failureThreshold = options.failureThreshold ?? 3;
    this.#cooldownMs = options.cooldownMs ?? 5_000;
    this.#fetch = options.fetch ?? fetch;
    this.#now = options.now ?? Date.now;
  }

  async execute(functionName: string, input?: string): Promise<VmixAdapterResult> {
    if (!this.#enabled) {
      return { ok: false, code: "VMIX_DISABLED", message: "vMix adapter is disabled" };
    }

    if (this.#openedAt !== null && this.#now() - this.#openedAt < this.#cooldownMs) {
      return { ok: false, code: "CIRCUIT_OPEN", message: "vMix circuit breaker is open" };
    }
    if (this.#openedAt !== null) {
      this.#openedAt = null;
      this.#failures = 0;
    }

    const url = new URL(this.#baseUrl);
    url.searchParams.set("Function", functionName);
    if (input) {
      url.searchParams.set("Input", input);
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.#timeoutMs);

    try {
      const response = await this.#fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`vMix returned HTTP ${response.status}`);
      }
      this.#failures = 0;
      return { ok: true, status: response.status };
    } catch (error) {
      this.#failures += 1;
      if (this.#failures >= this.#failureThreshold) {
        this.#openedAt = this.#now();
      }
      return {
        ok: false,
        code: "VMIX_UNAVAILABLE",
        message: error instanceof Error ? error.message : "vMix request failed"
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
