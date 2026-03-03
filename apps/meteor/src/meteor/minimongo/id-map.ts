export class IdMap<T = any> extends Map<string, T> {
  // Alias for Meteor's old IdMap.set
  override set(id: string, value: T): this {
    return super.set(id, value);
  }

  // Alias for Meteor's old IdMap.remove
  remove(id: string): boolean {
    return super.delete(id);
  }

  // Deep clone support required for optimistic UI (saveOriginals)
  clone(): IdMap<T> {
    const cloned = new IdMap<T>();
    this.forEach((value, key) => {
      cloned.set(key, structuredClone(value));
    });
    return cloned;
  }

  // Alias to check if empty
  empty(): boolean {
    return this.size === 0;
  }
}