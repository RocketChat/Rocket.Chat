import { Meteor } from 'meteor/meteor';

import { use } from './Middleware';
import { settings } from './functions/settings';


const getProcessingTimeInMS = (time: [number, number]): number => time[0] * 1000 + time[1] / 1e6;

settings.watch = use(settings.watch, (context, next) => {
	const [_id, callback] = context;
	return next(_id, Meteor.bindEnvironment(callback));
});

if (process.env.DEBUG_SETTINGS === 'true') {
	settings.watch = use(settings.watch, function watch(context, next) {
		const [_id, callback, options] = context;
		return next(_id, (...args) => {
			const start = process.hrtime();
			callback(...args);
			const elapsed = process.hrtime(start);
			console.log(`settings.watch: ${ _id } ${ getProcessingTimeInMS(elapsed) }ms`);
		}, options);
	});
}
settings.watchMultiple = use(settings.watchMultiple, (context, next) => {
	const [_id, callback] = context;
	return next(_id, Meteor.bindEnvironment(callback));
});
settings.watchOnce = use(settings.watchOnce, (context, next) => {
	const [_id, callback] = context;
	return next(_id, Meteor.bindEnvironment(callback));
});

settings.change = use(settings.change, (context, next) => {
	const [_id, callback] = context;
	return next(_id, Meteor.bindEnvironment(callback));
});
settings.changeMultiple = use(settings.changeMultiple, (context, next) => {
	const [_id, callback] = context;
	return next(_id, Meteor.bindEnvironment(callback));
});
settings.changeOnce = use(settings.changeOnce, (context, next) => {
	const [_id, callback] = context;
	return next(_id, Meteor.bindEnvironment(callback));
});
