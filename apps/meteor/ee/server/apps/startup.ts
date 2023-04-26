import { Meteor } from 'meteor/meteor';

import { Apps } from './orchestrator';
import '../../../app/apps/server/api';

Meteor.startup(function _appServerOrchestrator() {
	Apps.initialize();

	void Apps.load();
});
