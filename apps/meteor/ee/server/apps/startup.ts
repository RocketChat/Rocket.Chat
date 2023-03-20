import { Meteor } from 'meteor/meteor';

import { Apps } from './orchestrator';

Meteor.startup(function _appServerOrchestrator() {
	Apps.initialize();

	void Apps.load();
});
