type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();

  async remember<T>(
    key: string,
    ttl: number,
    callback: () => Promise<T>,
  ): Promise<T> {
    const cached = this.cache.get(key);

    if (cached && cached.expiresAt > Date.now()) {
      console.log(`Cache HIT: ${key}`);
      return cached.data;
    }

    console.log(`Cache MISS: ${key}`);

    const data = await callback();

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    });

    return data;
  }

  forget(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  has(key: string) {
    const cached = this.cache.get(key);

    return !!cached && cached.expiresAt > Date.now();
  }
}

export const cache = new CacheService();
