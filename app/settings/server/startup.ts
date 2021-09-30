import { Meteor } from 'meteor/meteor';

import { use } from './Middleware';
import { SettingsVersion4 } from './Settingsv4';


const getProcessingTimeInMS = (time: [number, number]): number => time[0] * 1000 + time[1] / 1e6;

SettingsVersion4.watch = use(SettingsVersion4.watch, (context, next) => {
	const [_id, callback] = context;
	return next(_id, Meteor.bindEnvironment(callback));
});

if (process.env.DEBUG_SETTINGS === 'true') {
	SettingsVersion4.watch = use(SettingsVersion4.watch, function watch(context, next) {
		const [_id, callback, options] = context;
		return next(_id, (...args) => {
			const start = process.hrtime();
			callback(...args);
			const elapsed = process.hrtime(start);
			console.log(`SettingsVersion4.watch: ${ _id } ${ getProcessingTimeInMS(elapsed) }ms`);
		}, options);
	});
}
SettingsVersion4.watchMultiple = use(SettingsVersion4.watchMultiple, (context, next) => {
	const [_id, callback] = context;
	return next(_id, Meteor.bindEnvironment(callback));
});
SettingsVersion4.watchOnce = use(SettingsVersion4.watchOnce, (context, next) => {
	const [_id, callback] = context;
	return next(_id, Meteor.bindEnvironment(callback));
});

SettingsVersion4.change = use(SettingsVersion4.change, (context, next) => {
	const [_id, callback] = context;
	return next(_id, Meteor.bindEnvironment(callback));
});
SettingsVersion4.changeMultiple = use(SettingsVersion4.changeMultiple, (context, next) => {
	const [_id, callback] = context;
	return next(_id, Meteor.bindEnvironment(callback));
});
SettingsVersion4.changeOnce = use(SettingsVersion4.changeOnce, (context, next) => {
	const [_id, callback] = context;
	return next(_id, Meteor.bindEnvironment(callback));
});
