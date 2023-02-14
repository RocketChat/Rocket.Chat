import { Meteor } from 'meteor/meteor';

import { use } from './Middleware';
import { settings } from './cached';

const getProcessingTimeInMS = (time: [number, number]): number => time[0] * 1000 + time[1] / 1e6;

settings.watch = use(settings.watch, (context, next) => {
	const [_id, callback, ...args] = context;
	return next(_id, Meteor.bindEnvironment(callback), ...args);
});

if (process.env.DEBUG_SETTINGS === 'true') {
	settings.watch = use(settings.watch, function watch(context, next) {
		const [_id, callback, options] = context;
		return next(
			_id,
			(...args) => {
				const start = process.hrtime();
				callback(...args);
				const elapsed = process.hrtime(start);
				console.log(`settings.watch: ${_id} ${getProcessingTimeInMS(elapsed)}ms`);
			},
			options,
		);
	});
}
settings.watchMultiple = use(settings.watchMultiple, (context, next) => {
	const [_id, callback, ...args] = context;
	return next(_id, Meteor.bindEnvironment(callback), ...args);
});
settings.watchOnce = use(settings.watchOnce, (context, next) => {
	const [_id, callback, ...args] = context;
	return next(_id, Meteor.bindEnvironment(callback), ...args);
});

settings.watchByRegex = use(settings.watchByRegex, (context, next) => {
	const [_id, callback, ...args] = context;
	return next(_id, Meteor.bindEnvironment(callback), ...args);
});

settings.change = use(settings.change, (context, next) => {
	const [_id, callback, ...args] = context;
	return next(_id, Meteor.bindEnvironment(callback), ...args);
});
settings.changeMultiple = use(settings.changeMultiple, (context, next) => {
	const [_id, callback, ...args] = context;
	return next(_id, Meteor.bindEnvironment(callback), ...args);
});
settings.changeOnce = use(settings.changeOnce, (context, next) => {
	const [_id, callback, ...args] = context;
	return next(_id, Meteor.bindEnvironment(callback), ...args);
});

settings.changeByRegex = use(settings.changeByRegex, (context, next) => {
	const [_id, callback, ...args] = context;
	return next(_id, Meteor.bindEnvironment(callback), ...args);
});

settings.onReady = use(settings.onReady, (context, next) => {
	const [callback, ...args] = context;
	return next(Meteor.bindEnvironment(callback), ...args);
});
