export interface EnduranceSample {
  elapsedMs: number;
  frameDurationMs: number;
  processMemoryBytes: number;
  clockElapsedMs: number;
  referenceElapsedMs: number;
}

export interface EnduranceSummary {
  sampleCount: number;
  averageFps: number;
  maximumClockDriftMs: number;
  peakMemoryBytes: number;
  memoryGrowthBytes: number;
}

export class EnduranceMetrics {
  readonly #samples: EnduranceSample[] = [];

  add(sample: EnduranceSample): void {
    this.#samples.push(structuredClone(sample));
  }

  get samples(): readonly EnduranceSample[] {
    return structuredClone(this.#samples);
  }

  summarize(): EnduranceSummary {
    if (this.#samples.length === 0) {
      return {
        sampleCount: 0,
        averageFps: 0,
        maximumClockDriftMs: 0,
        peakMemoryBytes: 0,
        memoryGrowthBytes: 0
      };
    }

    const averageFrameDuration =
      this.#samples.reduce((sum, sample) => sum + sample.frameDurationMs, 0) / this.#samples.length;
    const first = this.#samples[0];
    const last = this.#samples.at(-1);

    return {
      sampleCount: this.#samples.length,
      averageFps: averageFrameDuration > 0 ? 1_000 / averageFrameDuration : 0,
      maximumClockDriftMs: Math.max(
        ...this.#samples.map((sample) =>
          Math.abs(sample.clockElapsedMs - sample.referenceElapsedMs)
        )
      ),
      peakMemoryBytes: Math.max(...this.#samples.map((sample) => sample.processMemoryBytes)),
      memoryGrowthBytes: first && last ? last.processMemoryBytes - first.processMemoryBytes : 0
    };
  }
}
