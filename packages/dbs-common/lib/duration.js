/* globals _dbs */

class Duration {
	constructor(ms) {
		this.ms = ms;
		this.date = new Date(ms);
	}

	static padZero(i) {
		return ( i < 10 ? "0" + i : i );
	}

	toHHMMSS() {
		return Math.floor(this.ms / 3600000) + ':' + Duration.padZero(this.date.getMinutes()) + ':' +
			   Duration.padZero(this.date.getSeconds())
	}

	toMM() {
		return Duration.padZero(Math.floor(this.ms / 60000));
	}
}

_dbs.Duration = Duration;
