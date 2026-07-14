interface FailedAttemptInfo {
    key: string;
    count: number;
    firstAttempt: Date;
    lastAttempt: Date;
    timeoutId?: ReturnType<typeof setTimeout>;
}

class LoginAnomalyAggregator {
    private buffer: Map<string, FailedAttemptInfo> = new Map();
    private readonly FLUSH_WINDOW_MS = 45 * 1000;
    private readonly MAX_BUFFER_SIZE = 1000;

    public logFailure(ip: string, userId?: string): void {
        const now = new Date();
        
        const keys = [`ip:${ip}`];
        if (userId) {
            keys.push(`user:${userId}`);
        }

        for (const key of keys) {
            this.processFailureForKey(key, now);
        }
    }

    private processFailureForKey(key: string, now: Date): void {
        if (this.buffer.size >= this.MAX_BUFFER_SIZE && !this.buffer.has(key)) {
            const oldestKey = this.buffer.keys().next().value;
            if (oldestKey) {
                void this.flushEvent(oldestKey);
            }
        }

        if (this.buffer.has(key)) {
            const entry = this.buffer.get(key)!;
            entry.count += 1;
            entry.lastAttempt = now;
        } else {
            const entry: FailedAttemptInfo = {
                key,
                count: 1,
                firstAttempt: now,
                lastAttempt: now,
            };

            entry.timeoutId = setTimeout(() => {
                void this.flushEvent(key);
            }, this.FLUSH_WINDOW_MS);
            this.buffer.set(key, entry);
        }
    }

    private async flushEvent(key: string): Promise<void> {
        const entry = this.buffer.get(key);
        if (!entry) return;

        if (entry.timeoutId) {
            clearTimeout(entry.timeoutId);
        }

        this.buffer.delete(key);

        if (entry.count > 3) {
            await this.recordAnomaly(entry);
        }
    }

    private async recordAnomaly(entry: Omit<FailedAttemptInfo, 'timeoutId'>): Promise<void> {
        const severity = entry.count >= 10 ? 'high' : 'medium';
        const durationInSeconds = Math.round((entry.lastAttempt.getTime() - entry.firstAttempt.getTime()) / 1000);

        console.error(
            `🔥 [Auth Anomaly Aggregator] ` +
            `Target: ${entry.key} | ` +
            `Attempts: ${entry.count} | ` +
            `Window: ${durationInSeconds}s | ` +
            `Severity: ${severity}`
        );
    }
}

export const anomalyAggregator = new LoginAnomalyAggregator();