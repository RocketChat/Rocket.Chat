import { Meteor } from 'meteor/meteor';

import { use } from './Middleware';
import { SettingsVersion4 } from './Settingsv4';


const getProcessingTimeInMS = (time: [number, number]): string => `${ (time[0] * 1000 + time[1] / 1e6).toFixed(2) }ms`;

SettingsVersion4.watch = use(SettingsVersion4.watch.bind(SettingsVersion4), (context, next) => {
	const [_id, callback] = context;
	return next(_id, Meteor.bindEnvironment(callback));
});

SettingsVersion4.watch = use(SettingsVersion4.watch.bind(SettingsVersion4), function watch(context, next) {
	const [_id, callback, options] = context;
	return next(_id, (...args) => {
		const start = process.hrtime();
		callback(...args);
		const elapsed = process.hrtime(start);
		console.log(`SettingsVersion4.watch: ${ _id } ${ getProcessingTimeInMS(elapsed) }`);
	}, options);
});


SettingsVersion4.watchMultiple = use(SettingsVersion4.watchMultiple.bind(SettingsVersion4), (context, next) => {
	const [_id, callback] = context;
	return next(_id, Meteor.bindEnvironment(callback));
});
SettingsVersion4.watchOnce = use(SettingsVersion4.watchOnce.bind(SettingsVersion4), (context, next) => {
	const [_id, callback] = context;
	return next(_id, Meteor.bindEnvironment(callback));
});

SettingsVersion4.change = use(SettingsVersion4.change.bind(SettingsVersion4), (context, next) => {
	const [_id, callback] = context;
	return next(_id, Meteor.bindEnvironment(callback));
});
SettingsVersion4.changeMultiple = use(SettingsVersion4.changeMultiple.bind(SettingsVersion4), (context, next) => {
	const [_id, callback] = context;
	return next(_id, Meteor.bindEnvironment(callback));
});
SettingsVersion4.changeOnce = use(SettingsVersion4.changeOnce.bind(SettingsVersion4), (context, next) => {
	const [_id, callback] = context;
	return next(_id, Meteor.bindEnvironment(callback));
});
