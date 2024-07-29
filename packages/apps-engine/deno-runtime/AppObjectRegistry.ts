export type Maybe<T> = T | null | undefined;

export const AppObjectRegistry = new class {
    registry: Record<string, unknown> = {};

    public get<T>(key: string): Maybe<T> {
        return this.registry[key] as Maybe<T>;
    }

    public set(key: string, value: unknown): void {
        this.registry[key] = value;
    }

    public has(key: string): boolean {
        return key in this.registry;
    }

    public delete(key: string): void {
        delete this.registry[key];
    }

    public clear(): void {
        this.registry = {};
    }
}

