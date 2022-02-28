import { Meteor } from 'meteor/meteor';

import { Settings } from '../../../../app/models/server';
import { settings } from '../../../../app/settings/server';

export function messageAuditingLoadCount(): void {
	const loadCount = settings.get('Message_Auditing_Panel_Load_Count');
	if (typeof loadCount !== 'number') {
		return;
	}
	Settings.updateValueById('Message_Auditing_Panel_Load_Count', loadCount + 1);
}

Meteor.methods({
	messageAuditingApplyCount() {
		const applyCount = settings.get('Message_Auditing_Apply_Count');
		if (typeof applyCount !== 'number') {
			return;
		}
		Settings.updateValueById('Message_Auditing_Apply_Count', applyCount + 1);
	},
});
