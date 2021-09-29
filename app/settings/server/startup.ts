import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { use } from './Middleware';
import { SettingsVersion4 } from './Settingsv4';

SettingsVersion4.watch = use(SettingsVersion4.watch.bind(SettingsVersion4), (context, next) => {
	const [_id, callback] = context;
	return next(_id, Meteor.bindEnvironment(callback));
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
