import { Meteor } from 'meteor/meteor';

import { Apps, createAppsSettings } from './orchestrator';

Meteor.startup(async function _appServerOrchestrator() {
	await createAppsSettings();
	Apps.initialize();

	void Apps.load();
});
