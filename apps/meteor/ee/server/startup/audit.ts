import { Meteor } from 'meteor/meteor';

import { onLicense } from '../../app/license/server';
import { createPermissions } from '../lib/audit/startup';

onLicense('auditing', async () => {
	await import('../lib/audit/methods');

	Meteor.startup(() => {
		createPermissions();
	});
});
