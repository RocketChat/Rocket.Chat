import type { AppStatus } from '../definition/AppStatus';

export class AppStatusCache {
    private readonly cache: Record<string, { status: AppStatus, expiresAt: Date }> = {};
    private readonly CACHE_TTL = 1000 * 60;

    // We clean up the cache every 5 minutes
    private readonly CLEANUP_INTERVAL = 1000 * 60 * 5;

    public constructor() {
        setInterval(() => this.clearExpired(), this.CLEANUP_INTERVAL);
    }

    public set(appId: string, status: AppStatus): void {
        this.cache[appId] = {
            status,
            expiresAt: new Date(Date.now() + this.CACHE_TTL),
        };
    }

    public get(appId: string): AppStatus | undefined {
        const cache = this.cache[appId];

        if (cache && cache.expiresAt > new Date()) {
            return cache.status;
        }

        return undefined;
    }

    private clearExpired(): void {
        const now = new Date();

        for (const appId in this.cache) {
            if (this.cache[appId].expiresAt < now) {
                delete this.cache[appId];
            }
        }
    }
}
