export type SessionMode = "production" | "rehearsal";

export interface SessionRequest {
  sessionId: string;
  mode: SessionMode;
}

export interface SessionAccess {
  sessionId: string;
  mode: SessionMode;
  stateNamespace: string;
  canWrite: boolean;
  leaseExpiresAt: number | null;
}

interface ProductionLease {
  sessionId: string;
  expiresAt: number;
}

export class ProductionLeaseManager {
  #productionLease: ProductionLease | null = null;

  constructor(private readonly ttlMs = 5_000) {
    if (!Number.isSafeInteger(ttlMs) || ttlMs <= 0) {
      throw new Error("Production lease TTL must be a positive integer");
    }
  }

  open(request: SessionRequest, nowMs = Date.now()): SessionAccess {
    if (request.mode === "rehearsal") {
      return {
        sessionId: request.sessionId,
        mode: request.mode,
        stateNamespace: `rehearsal:${request.sessionId}`,
        canWrite: true,
        leaseExpiresAt: null
      };
    }

    this.expire(nowMs);
    if (!this.#productionLease || this.#productionLease.sessionId === request.sessionId) {
      this.#productionLease = {
        sessionId: request.sessionId,
        expiresAt: nowMs + this.ttlMs
      };
      return {
        sessionId: request.sessionId,
        mode: request.mode,
        stateNamespace: "production",
        canWrite: true,
        leaseExpiresAt: this.#productionLease.expiresAt
      };
    }

    return {
      sessionId: request.sessionId,
      mode: request.mode,
      stateNamespace: "production",
      canWrite: false,
      leaseExpiresAt: this.#productionLease.expiresAt
    };
  }

  heartbeat(sessionId: string, nowMs = Date.now()): boolean {
    this.expire(nowMs);
    if (this.#productionLease?.sessionId !== sessionId) {
      return false;
    }

    this.#productionLease.expiresAt = nowMs + this.ttlMs;
    return true;
  }

  release(sessionId: string): boolean {
    if (this.#productionLease?.sessionId !== sessionId) {
      return false;
    }

    this.#productionLease = null;
    return true;
  }

  current(nowMs = Date.now()): Readonly<ProductionLease> | null {
    this.expire(nowMs);
    return this.#productionLease ? { ...this.#productionLease } : null;
  }

  private expire(nowMs: number): void {
    if (this.#productionLease && this.#productionLease.expiresAt <= nowMs) {
      this.#productionLease = null;
    }
  }
}
