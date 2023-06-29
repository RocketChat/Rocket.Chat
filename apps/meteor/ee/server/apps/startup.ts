import { Meteor } from 'meteor/meteor';

import { Apps } from './orchestrator';
import { addAppsSettings, watchAppsSettingsChanges } from '../../../app/apps/server/settings';

addAppsSettings();
watchAppsSettingsChanges();

Meteor.startup(function _appServerOrchestrator() {
	Apps.initialize();

	void Apps.load();
});
