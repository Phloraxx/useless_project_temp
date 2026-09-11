function xmur3(input: string): () => number {
  let h = 1779033703 ^ input.length;
  for (let i = 0; i < input.length; i += 1) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class SeededRandom {
  private readonly nextValue: () => number;

  constructor(seed: string | number, domain = 'default') {
    const seedFactory = xmur3(`${String(seed)}::${domain}`);
    this.nextValue = mulberry32(seedFactory());
  }

  next(): number {
    return this.nextValue();
  }

  chance(probability: number): boolean {
    return this.next() < Math.max(0, Math.min(1, probability));
  }

  weightedIndex(weights: readonly number[]): number | null {
    const total = weights.reduce((sum, value) => sum + Math.max(0, value), 0);
    if (total <= 0) return null;
    let cursor = this.next() * total;
    for (let i = 0; i < weights.length; i += 1) {
      cursor -= Math.max(0, weights[i] ?? 0);
      if (cursor < 0) return i;
    }
    return weights.length - 1;
  }
}
