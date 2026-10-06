export class TtlCache<V> {
  private items = new Map<string, { value: V; expires: number }>();
  private ttlMs: number;
  private max: number;

  constructor(ttlMs: number, max: number) {
    this.ttlMs = ttlMs;
    this.max = max;
  }

  get(key: string, now = Date.now()): V | undefined {
    const e = this.items.get(key);
    if (!e) return undefined;
    if (e.expires <= now) {
      this.items.delete(key);
      return undefined;
    }
    return e.value;
  }

  set(key: string, value: V, now = Date.now()) {
    if (!this.items.has(key) && this.items.size >= this.max) {
      for (const [k, e] of this.items) if (e.expires <= now) this.items.delete(k);
      while (this.items.size >= this.max) {
        const oldest = this.items.keys().next().value;
        if (oldest === undefined) break;
        this.items.delete(oldest);
      }
    }
    this.items.set(key, { value, expires: now + this.ttlMs });
  }

  get size() {
    return this.items.size;
  }
}
