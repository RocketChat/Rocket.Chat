RocketChat.statsTracker = new (class StatsTracker {
	constructor() {
		this.StatsD = Npm.require('node-dogstatsd').StatsD;
		this.dogstatsd = new this.StatsD();
	}

	track(type, stats, ...args) {
		this.dogstatsd[type](`RocketChat.${ stats }`, ...args);
	}

	now() {
		const hrtime = process.hrtime();
		return (hrtime[0] * 1000000 + hrtime[1] / 1000);
	}

	timing(stats, time, tags) {
		this.track('timing', stats, time, tags);
	}

	increment(stats, time, tags) {
		this.track('increment', stats, time, tags);
	}

	decrement(stats, time, tags) {
		this.track('decrement', stats, time, tags);
	}

	histogram(stats, time, tags) {
		this.track('histogram', stats, time, tags);
	}

	gauge(stats, time, tags) {
		this.track('gauge', stats, time, tags);
	}

	unique(stats, time, tags) {
		this.track('unique', stats, time, tags);
	}

	set(stats, time, tags) {
		this.track('set', stats, time, tags);
	}
});
