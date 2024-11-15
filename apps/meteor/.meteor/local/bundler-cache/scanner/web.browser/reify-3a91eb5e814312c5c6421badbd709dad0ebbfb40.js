(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define(['moment-timezone'], factory);
	} else if (typeof exports === 'object') {
		module.exports = factory(
			require('moment-timezone'),
			require('child_process')
		);
	} else {
		root.Cron = factory(root.moment);
	}
})(this, function(moment, childProcess) {
	var exports = {};
	var timeUnits = [
		'second',
		'minute',
		'hour',
		'dayOfMonth',
		'month',
		'dayOfWeek'
	];
	var spawn = childProcess && childProcess.spawn;

	function CronTime(source, zone, utcOffset) {
		this.source = source;

		if (zone) {
			if (moment.tz.names().indexOf(zone) === -1) {
				throw new Error('Invalid timezone.');
			}

			this.zone = zone;
		}

		if (typeof utcOffset !== 'undefined') this.utcOffset = utcOffset;

		var that = this;
		timeUnits.map(function(timeUnit) {
			that[timeUnit] = {};
		});

		if (this.source instanceof Date || this.source._isAMomentObject) {
			this.source = moment(this.source);
			this.realDate = true;
		} else {
			this._parse();
			this._verifyParse();
		}
	}

	CronTime.constraints = [[0, 59], [0, 59], [0, 23], [1, 31], [0, 11], [0, 6]];
	CronTime.monthConstraints = [
		31,
		29, // support leap year...not perfect
		31,
		30,
		31,
		30,
		31,
		31,
		30,
		31,
		30,
		31
	];
	CronTime.parseDefaults = ['0', '*', '*', '*', '*', '*'];
	CronTime.aliases = {
		jan: 0,
		feb: 1,
		mar: 2,
		apr: 3,
		may: 4,
		jun: 5,
		jul: 6,
		aug: 7,
		sep: 8,
		oct: 9,
		nov: 10,
		dec: 11,
		sun: 0,
		mon: 1,
		tue: 2,
		wed: 3,
		thu: 4,
		fri: 5,
		sat: 6
	};

	CronTime.prototype = {
		_verifyParse: function() {
			var months = Object.keys(this.month);
			var ok = false;

			/* if a dayOfMonth is not found in all months, we only need to fix the last
			 wrong month  to prevent infinite loop */
			var lastWrongMonth = NaN;
			for (var i = 0; i < months.length; i++) {
				var m = months[i];
				var con = CronTime.monthConstraints[parseInt(m, 10)];
				var dsom = Object.keys(this.dayOfMonth);

				for (var j = 0; j < dsom.length; j++) {
					var dom = dsom[j];
					if (dom <= con) {
						ok = true;
					}
				}

				if (!ok) {
					// save the month in order to be fixed if all months fails (infinite loop)
					lastWrongMonth = m;
					console.warn("Month '" + m + "' is limited to '" + con + "' days.");
				}
			}

			// infinite loop detected (dayOfMonth is not found in all months)
			if (!ok) {
				var con = CronTime.monthConstraints[parseInt(lastWrongMonth, 10)];
				var dsom = Object.keys(this.dayOfMonth);
				for (var k = 0; k < dsom.length; k++) {
					var dom = dsom[k];
					if (dom > con) {
						delete this.dayOfMonth[dom];
						var fixedDay = Number(dom) % con;
						this.dayOfMonth[fixedDay] = true;
					}
				}
			}
		},

		/**
		 * calculates the next send time
		 */
		sendAt: function(i) {
			var date = this.realDate ? this.source : moment();
			// Set the timezone if given (http://momentjs.com/timezone/docs/#/using-timezones/parsing-in-zone/)
			if (this.zone) {
				date = date.tz(this.zone);
			}

			if (typeof this.utcOffset !== 'undefined') {
				date = date.utcOffset(this.utcOffset);
			}

			if (this.realDate) {
				const diff = moment().diff(date, 's');
				if (diff > 0) {
					throw new Error('WARNING: Date in past. Will never be fired.');
				}

				return date;
			}

			// If the i argument is not given, return the next send time
			if (isNaN(i) || i < 0) {
				date = this._getNextDateFrom(date);

				return date;
			} else {
				// Else return the next i send times
				var dates = [];
				for (; i > 0; i--) {
					date = this._getNextDateFrom(date);
					dates.push(moment(date));
				}

				return dates;
			}
		},

		/**
		 * Get the number of milliseconds in the future at which to fire our callbacks.
		 */
		getTimeout: function() {
			return Math.max(-1, this.sendAt() - moment());
		},

		/**
		 * writes out a cron string
		 */
		toString: function() {
			return this.toJSON().join(' ');
		},

		/**
		 * Json representation of the parsed cron syntax.
		 */
		toJSON: function() {
			var self = this;
			return timeUnits.map(function(timeName) {
				return self._wcOrAll(timeName);
			});
		},

		/**
		 * get next date that matches parsed cron time
		 */
		_getNextDateFrom: function(start, zone) {
			var date;
			var firstDate = moment(start).valueOf();
			if (zone) {
				date = moment(start).tz(zone);
			} else {
				date = moment(start);
			}
			if (!this.realDate) {
				const milliseconds =
					(start.milliseconds && start.milliseconds()) ||
					(start.getMilliseconds && start.getMilliseconds()) ||
					0;
				if (milliseconds > 0) {
					date.milliseconds(0);
					date.seconds(date.seconds() + 1);
				}
			}

			if (date.toString() === 'Invalid date') {
				throw new Error('ERROR: You specified an invalid date.');
			}

			// it shouldn't take more than 5 seconds to find the next execution time
			// being very generous with this. Throw error if it takes too long to find the next time to protect from
			// infinite loop.
			var timeout = Date.now() + 5000;
			// determine next date
			while (true) {
				var diff = date - start;
				var prevMonth = date.month();
				var prevDay = date.days();
				var prevMinute = date.minutes();
				var prevSeconds = date.seconds();
				var origDate = new Date(date);

				if (Date.now() > timeout) {
					throw new Error(
						`Something went wrong. cron reached maximum iterations.
						Please open an  issue (https://github.com/kelektiv/node-cron/issues/new) and provide the following string
						Time Zone: ${zone || '""'} - Cron String: ${this} - UTC offset: ${date.format(
							'Z'
						)} - current Date: ${moment().toString()}`
					);
				}
				if (
					!(date.month() in this.month) &&
					Object.keys(this.month).length !== 12
				) {
					date.add(1, 'M');
					if (date.month() === prevMonth) {
						date.add(1, 'M');
					}
					date.date(1);
					date.hours(0);
					date.minutes(0);
					date.seconds(0);
					continue;
				}

				if (
					!(date.date() in this.dayOfMonth) &&
					Object.keys(this.dayOfMonth).length !== 31 &&
					!(
						date.day() in this.dayOfWeek &&
						Object.keys(this.dayOfWeek).length !== 7
					)
				) {
					date.add(1, 'd');
					if (date.days() === prevDay) {
						date.add(1, 'd');
					}
					date.hours(0);
					date.minutes(0);
					date.seconds(0);
					continue;
				}

				if (
					!(date.day() in this.dayOfWeek) &&
					Object.keys(this.dayOfWeek).length !== 7 &&
					!(
						date.date() in this.dayOfMonth &&
						Object.keys(this.dayOfMonth).length !== 31
					)
				) {
					date.add(1, 'd');
					if (date.days() === prevDay) {
						date.add(1, 'd');
					}
					date.hours(0);
					date.minutes(0);
					date.seconds(0);
					if (date <= origDate) {
						date = this._findDST(origDate);
					}
					continue;
				}

				if (
					!(date.hours() in this.hour) &&
					Object.keys(this.hour).length !== 24
				) {
					origDate = moment(date);
					var curHour = date.hours();
					date.hours(
						date.hours() === 23 && diff > 86400000 ? 0 : date.hours() + 1
					);
					/*
					 * Moment Date will not allow you to set the time to 2 AM if there is no 2 AM (on the day we change the clock)
					 * We will therefore jump to 3AM if time stayed at 1AM
					 */
					if (curHour === date.hours()) {
						date.hours(date.hours() + 2);
					}
					date.minutes(0);
					date.seconds(0);
					if (date <= origDate) {
						date = this._findDST(origDate);
					}
					continue;
				}

				if (
					!(date.minutes() in this.minute) &&
					Object.keys(this.minute).length !== 60
				) {
					origDate = moment(date);
					date.minutes(
						date.minutes() === 59 && diff > 60 * 60 * 1000
							? 0
							: date.minutes() + 1
					);
					date.seconds(0);
					if (date <= origDate) {
						date = this._findDST(origDate);
					}
					continue;
				}

				if (
					!(date.seconds() in this.second) &&
					Object.keys(this.second).length !== 60
				) {
					origDate = moment(date);
					date.seconds(
						date.seconds() === 59 && diff > 60 * 1000 ? 0 : date.seconds() + 1
					);
					if (date <= origDate) {
						date = this._findDST(origDate);
					}
					continue;
				}

				if (date.valueOf() === firstDate) {
					date.seconds(date.seconds() + 1);
					continue;
				}

				break;
			}

			return date;
		},

		/**
		 * get next date that is a valid DST date
		 */
		_findDST: function(date) {
			var newDate = moment(date);
			while (newDate <= date) {
				// eslint seems to trigger here, it is wrong
				newDate.add(1, 's');
			}

			return newDate;
		},

		/**
		 * wildcard, or all params in array (for to string)
		 */
		_wcOrAll: function(type) {
			if (this._hasAll(type)) return '*';

			var all = [];
			for (var time in this[type]) {
				all.push(time);
			}

			return all.join(',');
		},

		_hasAll: function(type) {
			var constrain = CronTime.constraints[timeUnits.indexOf(type)];

			for (var i = constrain[0], n = constrain[1]; i < n; i++) {
				if (!(i in this[type])) return false;
			}

			return true;
		},

		_parse: function() {
			var aliases = CronTime.aliases;
			var source = this.source.replace(/[a-z]{1,3}/gi, function(alias) {
				alias = alias.toLowerCase();

				if (alias in aliases) {
					return aliases[alias];
				}

				throw new Error('Unknown alias: ' + alias);
			});
			var split = source.replace(/^\s\s*|\s\s*$/g, '').split(/\s+/);
			var cur;
			var i = 0;
			var len = timeUnits.length;

			// seconds are optional
			if (split.length < timeUnits.length - 1) {
				throw new Error('Too few fields');
			}
			if (split.length > timeUnits.length) {
				throw new Error('Too many fields');
			}

			for (; i < timeUnits.length; i++) {
				// If the split source string doesn't contain all digits,
				// assume defaults for first n missing digits.
				// This adds support for 5-digit standard cron syntax
				cur = split[i - (len - split.length)] || CronTime.parseDefaults[i];
				this._parseField(cur, timeUnits[i], CronTime.constraints[i]);
			}
		},

		_parseField: function(field, type, constraints) {
			var rangePattern = /^(\d+)(?:-(\d+))?(?:\/(\d+))?$/g;
			var typeObj = this[type];
			var pointer;
			var low = constraints[0];
			var high = constraints[1];

			var fields = field.split(',');
			fields.forEach(function(field) {
				var wildcardIndex = field.indexOf('*');
				if (wildcardIndex !== -1 && wildcardIndex !== 0) {
					throw new Error('Field (' + field + ') has an invalid wildcard expression');
				}
			});

			// * is a shortcut to [lower-upper] range
			field = field.replace(/\*/g, low + '-' + high);

			// commas separate information, so split based on those
			var allRanges = field.split(',');

			for (var i = 0; i < allRanges.length; i++) {
				if (allRanges[i].match(rangePattern)) {
					allRanges[i].replace(rangePattern, function($0, lower, upper, step) {
						lower = parseInt(lower, 10);
						upper = parseInt(upper, 10) || undefined;

						const wasStepDefined = !isNaN(parseInt(step, 10));
						if (step === '0') {
							throw new Error('Field (' + field + ') has a step of zero');
						}
						step = parseInt(step, 10) || 1;

						if (upper && lower > upper) {
							throw new Error('Field (' + field + ') has an invalid range');
						}

						const outOfRangeError =
							lower < low ||
							(upper && upper > high) ||
							(!upper && lower > high);

						if (outOfRangeError) {
							throw new Error('Field (' + field + ') value is out of range');
						}

						// Positive integer higher than constraints[0]
						lower = Math.min(Math.max(low, ~~Math.abs(lower)), high);

						// Positive integer lower than constraints[1]
						if (upper) {
							upper = Math.min(high, ~~Math.abs(upper));
						} else {
							// If step is provided, the default upper range is the highest value
							upper = wasStepDefined ? high : lower;
						}

						// Count from the lower barrier to the upper
						pointer = lower;

						do {
							typeObj[pointer] = true;
							pointer += step;
						} while (pointer <= upper);
					});
				} else {
					throw new Error('Field (' + field + ') cannot be parsed');
				}
			}
		}
	};

	function command2function(cmd) {
		var command;
		var args;

		switch (typeof cmd) {
			case 'string':
				args = cmd.split(' ');
				command = args.shift();

				cmd = spawn.bind(undefined, command, args);
				break;

			case 'object':
				command = cmd && cmd.command;
				if (command) {
					args = cmd.args;
					var options = cmd.options;

					cmd = spawn.bind(undefined, command, args, options);
				}
				break;
		}

		return cmd;
	}

	function CronJob(
		cronTime,
		onTick,
		onComplete,
		startNow,
		timeZone,
		context,
		runOnInit,
		utcOffset,
		unrefTimeout
	) {
		var _cronTime = cronTime;
		var argCount = 0;
		for (var i = 0; i < arguments.length; i++) {
			if (arguments[i] !== undefined) {
				argCount++;
			}
		}
		if (typeof cronTime !== 'string' && argCount === 1) {
			// crontime is an object...
			onTick = cronTime.onTick;
			onComplete = cronTime.onComplete;
			context = cronTime.context;
			startNow = cronTime.start || cronTime.startNow || cronTime.startJob;
			timeZone = cronTime.timeZone;
			runOnInit = cronTime.runOnInit;
			_cronTime = cronTime.cronTime;
			utcOffset = cronTime.utcOffset;
			unrefTimeout = cronTime.unrefTimeout;
		}

		this.context = context || this;
		this._callbacks = [];
		this.onComplete = command2function(onComplete);
		this.cronTime = new CronTime(_cronTime, timeZone, utcOffset);
		this.unrefTimeout = unrefTimeout;

		addCallback.call(this, command2function(onTick));

		if (runOnInit) {
			this.lastExecution = new Date();
			fireOnTick.call(this);
		}

		if (startNow) {
			start.call(this);
		}

		return this;
	}

	var addCallback = function(callback) {
		if (typeof callback === 'function') this._callbacks.push(callback);
	};
	CronJob.prototype.addCallback = addCallback;

	CronJob.prototype.setTime = function(time) {
		if (!(time instanceof CronTime))
			throw new Error('time must be an instance of CronTime.');
		this.stop();
		this.cronTime = time;
	};

	CronJob.prototype.nextDate = function() {
		return this.cronTime.sendAt();
	};

	var fireOnTick = function() {
		for (var i = this._callbacks.length - 1; i >= 0; i--)
			this._callbacks[i].call(this.context, this.onComplete);
	};
	CronJob.prototype.fireOnTick = fireOnTick;

	CronJob.prototype.nextDates = function(i) {
		return this.cronTime.sendAt(i);
	};

	var start = function() {
		if (this.running) return;

		var MAXDELAY = 2147483647; // The maximum number of milliseconds setTimeout will wait.
		var self = this;
		var timeout = this.cronTime.getTimeout();
		var remaining = 0;
		var startTime;

		if (this.cronTime.realDate) this.runOnce = true;

		function _setTimeout(timeout) {
			startTime = Date.now();
			self._timeout = setTimeout(callbackWrapper, timeout);
			if (self.unrefTimeout && typeof self._timeout.unref === 'function') {
				self._timeout.unref();
			}
		}

		// The callback wrapper checks if it needs to sleep another period or not
		// and does the real callback logic when it's time.

		function callbackWrapper() {
			var diff = startTime + timeout - Date.now();

			if (diff > 0) {
				var newTimeout = self.cronTime.getTimeout();

				if (newTimeout > diff) {
					newTimeout = diff;
				}

				remaining += newTimeout;
			}

			// If there is sleep time remaining, calculate how long and go to sleep
			// again. This processing might make us miss the deadline by a few ms
			// times the number of sleep sessions. Given a MAXDELAY of almost a
			// month, this should be no issue.

			self.lastExecution = new Date();
			if (remaining) {
				if (remaining > MAXDELAY) {
					remaining -= MAXDELAY;
					timeout = MAXDELAY;
				} else {
					timeout = remaining;
					remaining = 0;
				}

				_setTimeout(timeout);
			} else {
				// We have arrived at the correct point in time.

				self.running = false;

				// start before calling back so the callbacks have the ability to stop the cron job
				if (!self.runOnce) self.start();

				self.fireOnTick();
			}
		}

		if (timeout >= 0) {
			this.running = true;

			// Don't try to sleep more than MAXDELAY ms at a time.

			if (timeout > MAXDELAY) {
				remaining = timeout - MAXDELAY;
				timeout = MAXDELAY;
			}

			_setTimeout(timeout);
		} else {
			this.stop();
		}
	};

	CronJob.prototype.start = start;

	CronJob.prototype.lastDate = function() {
		return this.lastExecution;
	};

	/**
	 * Stop the cronjob.
	 */
	CronJob.prototype.stop = function() {
		if (this._timeout) clearTimeout(this._timeout);
		this.running = false;
		if (typeof this.onComplete === 'function') this.onComplete();
	};

	exports.job = function(
		cronTime,
		onTick,
		onComplete,
		startNow,
		timeZone,
		context,
		runOnInit,
		utcOffset,
		unrefTimeout
	) {
		return new CronJob(
			cronTime,
			onTick,
			onComplete,
			startNow,
			timeZone,
			context,
			runOnInit,
			utcOffset,
			unrefTimeout
		);
	};

	exports.time = function(cronTime, timeZone) {
		return new CronTime(cronTime, timeZone);
	};

	exports.sendAt = function(cronTime) {
		return exports.time(cronTime).sendAt();
	};

	exports.timeout = function(cronTime) {
		return exports.time(cronTime).getTimeout();
	};

	exports.CronJob = CronJob;
	exports.CronTime = CronTime;

	return exports;
});
