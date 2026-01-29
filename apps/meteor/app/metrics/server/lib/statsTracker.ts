// @ts-expect-error - no types available for node-dogstatsd
import { StatsD } from 'node-dogstatsd';

class StatsTracker {
	StatsD: typeof StatsD;

	dogstatsd: StatsD;

	constructor() {
		this.StatsD = StatsD;
		this.dogstatsd = new this.StatsD();
	}

	track(type: string, stats: string, ...args: any[]): void {
		(this.dogstatsd as any)[type](`RocketChat.${stats}`, ...args);
	}

	now(): number {
		const hrtime = process.hrtime();
		return hrtime[0] * 1000000 + hrtime[1] / 1000;
	}

	timing(stats: string, time: number, tags?: string[]): void {
		this.track('timing', stats, time, tags);
	}

	increment(stats: string, time?: number, tags?: string[]): void {
		this.track('increment', stats, time, tags);
	}

	decrement(stats: string, time?: number, tags?: string[]): void {
		this.track('decrement', stats, time, tags);
	}

	histogram(stats: string, time: number, tags?: string[]): void {
		this.track('histogram', stats, time, tags);
	}

	gauge(stats: string, time: number, tags?: string[]): void {
		this.track('gauge', stats, time, tags);
	}

	unique(stats: string, time: any, tags?: string[]): void {
		this.track('unique', stats, time, tags);
	}

	set(stats: string, time: any, tags?: string[]): void {
		this.track('set', stats, time, tags);
	}
}

export default new StatsTracker();
