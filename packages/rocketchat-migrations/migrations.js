/*
	Adds migration capabilities. Migrations are defined like:

	Migrations.add({
		up: function() {}, //*required* code to run to migrate upwards
		version: 1, //*required* number to identify migration order
		down: function() {}, //*optional* code to run to migrate downwards
		name: 'Something' //*optional* display name for the migration
	});

	The ordering of migrations is determined by the version you set.

	To run the migrations, set the MIGRATE environment variable to either
	'latest' or the version number you want to migrate to. Optionally, append
	',exit' if you want the migrations to exit the meteor process, e.g if you're
	migrating from a script (remember to pass the --once parameter).

	e.g:
	MIGRATE="latest" mrt # ensure we'll be at the latest version and run the app
	MIGRATE="latest,exit" mrt --once # ensure we'll be at the latest version and exit
	MIGRATE="2,exit" mrt --once # migrate to version 2 and exit

	Note: Migrations will lock ensuring only 1 app can be migrating at once. If
	a migration crashes, the control record in the migrations collection will
	remain locked and at the version it was at previously, however the db could
	be in an inconsistant state.
*/

// since we'll be at version 0 by default, we should have a migration set for
// it.
var DefaultMigration = {
	version: 0,
	up: function() {
		// @TODO: check if collection "migrations" exist
		// If exists, rename and rerun _migrateTo
	}
};

Migrations = {
	_list: [DefaultMigration],
	options: {
		// false disables logging
		log: true,
		// null or a function
		logger: null,
		// enable/disable info log "already at latest."
		logIfLatest: true,
		// lock will be valid for this amount of minutes
		lockExpiration: 5,
		// retry interval in seconds
		retryInterval: 10,
		// max number of attempts to retry unlock
		maxAttempts: 30,
		// migrations collection name
		collectionName: "migrations"
			// collectionName: "rocketchat_migrations"
	},
	config: function(opts) {
		this.options = _.extend({}, this.options, opts);
	},
}

Migrations._collection = new Mongo.Collection(Migrations.options.collectionName);

/* Create a box around messages for displaying on a console.log */
function makeABox(message, color = 'red') {
	if (!_.isArray(message)) {
		message = message.split("\n");
	}
	let len = _(message).reduce(function(memo, msg) {
		return Math.max(memo, msg.length)
	}, 0) + 4;
	let text = message.map((msg) => {
		return "|" [color] + s.lrpad(msg, len)[color] + "|" [color]
	}).join("\n");
	let topLine = "+" [color] + s.pad('', len, '-')[color] + "+" [color];
	let separator = "|" [color] + s.pad('', len, '') + "|" [color];
	let bottomLine = "+" [color] + s.pad('', len, '-')[color] + "+" [color];
	return `\n${topLine}\n${separator}\n${text}\n${separator}\n${bottomLine}\n`;
}

/*
	Logger factory function. Takes a prefix string and options object
	and uses an injected `logger` if provided, else falls back to
	Meteor's `Log` package.
	Will send a log object to the injected logger, on the following form:
		message: String
		level: String (info, warn, error, debug)
		tag: 'Migrations'
*/
function createLogger(prefix) {
	check(prefix, String);

	// Return noop if logging is disabled.
	if (Migrations.options.log === false) {
		return function() {};
	}

	return function(level, message) {
		check(level, Match.OneOf('info', 'error', 'warn', 'debug'));
		check(message, Match.OneOf(String, [String]));

		var logger = Migrations.options && Migrations.options.logger;

		if (logger && _.isFunction(logger)) {

			logger({
				level: level,
				message: message,
				tag: prefix
			});

		} else {
			Log[level]({
				message: prefix + ': ' + message
			});
		}
	}
}

var log;

var options = Migrations.options;

// collection holding the control record

log = createLogger('Migrations');

['info', 'warn', 'error', 'debug'].forEach(function(level) {
	log[level] = _.partial(log, level);
});

// if (process.env.MIGRATE)
//   Migrations.migrateTo(process.env.MIGRATE);

// Add a new migration:
// {up: function *required
//  version: Number *required
//  down: function *optional
//  name: String *optional
// }
Migrations.add = function(migration) {
	if (typeof migration.up !== 'function')
		throw new Meteor.Error('Migration must supply an up function.');

	if (typeof migration.version !== 'number')
		throw new Meteor.Error('Migration must supply a version number.');

	if (migration.version <= 0)
		throw new Meteor.Error('Migration version must be greater than 0');

	// Freeze the migration object to make it hereafter immutable
	Object.freeze(migration);

	this._list.push(migration);
	this._list = _.sortBy(this._list, function(m) {
		return m.version;
	});
}

// Attempts to run the migrations using command in the form of:
// e.g 'latest', 'latest,exit', 2
// use 'XX,rerun' to re-run the migration at that version
Migrations.migrateTo = function(command) {
	if (_.isUndefined(command) || command === '' || this._list.length === 0)
		throw new Error("Cannot migrate using invalid command: " + command);

	if (typeof command === 'number') {
		var version = command;
	} else {
		var version = command.split(',')[0];
		var subcommand = command.split(',')[1];
	}

	const maxAttempts = Migrations.options.maxAttempts;
	const retryInterval = Migrations.options.retryInterval;
	for (let attempts = 1; attempts <= maxAttempts; attempts++) {
		if (version === 'latest') {
			migrated = this._migrateTo(_.last(this._list).version);
		} else {
			migrated = this._migrateTo(parseInt(version), (subcommand === 'rerun'));
		}
		if (migrated) {
			break;
		} else {
			let willRetry;
			if (attempts < maxAttempts) {
				willRetry = ` Trying again in ${retryInterval} seconds.`;
				Meteor._sleepForMs(retryInterval * 1000);
			} else {
				willRetry = "";
			}
			console.log(`Not migrating, control is locked. Attempt ${attempts}/${maxAttempts}.${willRetry}`.yellow);
		}
	}
	if (!migrated) {
		let control = this._getControl(); // Side effect: upserts control document.
		console.log(makeABox([
			"ERROR! SERVER STOPPED",
			"",
			"Your database migration control is locked.",
			"Please make sure you are running the latest version and try again.",
			"If the problem persists, please contact support.",
			"",
			"This Rocket.Chat version: " + RocketChat.Info.version,
			"Database locked at version: " + control.version,
			"Database target version: " + (version === 'latest' ? _.last(this._list).version : version),
			"",
			"Commit: " + RocketChat.Info.commit.hash,
			"Date: " + RocketChat.Info.commit.date,
			"Branch: " + RocketChat.Info.commit.branch,
			"Tag: " + RocketChat.Info.commit.tag
		]));
		process.exit(1);
	}

	// remember to run meteor with --once otherwise it will restart
	if (subcommand === 'exit')
		process.exit(0);
}

// just returns the current version
Migrations.getVersion = function() {
	return this._getControl().version;
}

// migrates to the specific version passed in
Migrations._migrateTo = function(version, rerun) {
	var self = this;
	var control = this._getControl(); // Side effect: upserts control document.
	var currentVersion = control.version;

	if (lock() === false) {
		// log.info('Not migrating, control is locked.');
		// Warning
		return false;
	}

	if (rerun) {
		log.info('Rerunning version ' + version);
		migrate('up', version);
		log.info('Finished migrating.');
		unlock();
		return true;
	}

	if (currentVersion === version) {
		if (this.options.logIfLatest) {
			log.info('Not migrating, already at version ' + version);
		}
		unlock();
		return true;
	}

	var startIdx = this._findIndexByVersion(currentVersion);
	var endIdx = this._findIndexByVersion(version);

	// log.info('startIdx:' + startIdx + ' endIdx:' + endIdx);
	log.info('Migrating from version ' + this._list[startIdx].version + ' -> ' + this._list[endIdx].version);

	// run the actual migration
	function migrate(direction, idx) {
		var migration = self._list[idx];

		if (typeof migration[direction] !== 'function') {
			unlock();
			throw new Meteor.Error('Cannot migrate ' + direction + ' on version ' + migration.version);
		}

		function maybeName() {
			return migration.name ? ' (' + migration.name + ')' : '';
		}

		log.info('Running ' + direction + '() on version ' + migration.version + maybeName());

		try {
			migration[direction](migration);
		} catch (e) {
			console.log(makeABox([
				"ERROR! SERVER STOPPED",
				"",
				"Your database migration failed:",
				e.message,
				"",
				"Please make sure you are running the latest version and try again.",
				"If the problem persists, please contact support.",
				"",
				"This Rocket.Chat version: " + RocketChat.Info.version,
				"Database locked at version: " + control.version,
				"Database target version: " + version,
				"",
				"Commit: " + RocketChat.Info.commit.hash,
				"Date: " + RocketChat.Info.commit.date,
				"Branch: " + RocketChat.Info.commit.branch,
				"Tag: " + RocketChat.Info.commit.tag
			]));
			process.exit(1);
		}
	}

	// Returns true if lock was acquired.
	function lock() {
		const date = new Date();
		const dateMinusInterval = moment(date).subtract(self.options.lockExpiration, 'minutes').toDate();
		const build = RocketChat.Info ? RocketChat.Info.build.date : date;

		// This is atomic. The selector ensures only one caller at a time will see
		// the unlocked control, and locking occurs in the same update's modifier.
		// All other simultaneous callers will get false back from the update.
		return self._collection.update({
			_id: 'control',
			$or: [{
				locked: false
			}, {
				lockedAt: {
					$lt: dateMinusInterval
				}
			}, {
				buildAt: {
					$ne: build
				}
			}]
		}, {
			$set: {
				locked: true,
				lockedAt: date,
				buildAt: build
			}
		}) === 1;
	}


	// Side effect: saves version.
	function unlock() {
		self._setControl({
			locked: false,
			version: currentVersion
		});
	}

	if (currentVersion < version) {
		for (var i = startIdx; i < endIdx; i++) {
			migrate('up', i + 1);
			currentVersion = self._list[i + 1].version;
			self._setControl({
				locked: true,
				version: currentVersion
			});
		}
	} else {
		for (var i = startIdx; i > endIdx; i--) {
			migrate('down', i);
			currentVersion = self._list[i - 1].version;
			self._setControl({
				locked: true,
				version: currentVersion
			});
		}
	}

	unlock();
	log.info('Finished migrating.');
}

// gets the current control record, optionally creating it if non-existant
Migrations._getControl = function() {
	var control = this._collection.findOne({
		_id: 'control'
	});

	return control || this._setControl({
		version: 0,
		locked: false
	});
}

// sets the control record
Migrations._setControl = function(control) {
	// be quite strict
	check(control.version, Number);
	check(control.locked, Boolean);

	this._collection.update({
		_id: 'control'
	}, {
		$set: {
			version: control.version,
			locked: control.locked
		}
	}, {
		upsert: true
	});

	return control;
}

// returns the migration index in _list or throws if not found
Migrations._findIndexByVersion = function(version) {
	for (var i = 0; i < this._list.length; i++) {
		if (this._list[i].version === version)
			return i;
	}

	throw new Meteor.Error('Can\'t find migration version ' + version);
}

//reset (mainly intended for tests)
Migrations._reset = function() {
	this._list = [{
		version: 0,
		up: function() {}
	}];
	this._collection.remove({});
}

RocketChat.Migrations = Migrations;
