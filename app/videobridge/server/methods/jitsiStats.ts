import { Meteor } from 'meteor/meteor';

import { Settings } from '../../../models/server';
import { settings } from '../../../settings/server';

export function jitsiSlashCommandsCount(): void {
	const slashCount = settings.get('Jitsi_Start_SlashCommands_Count');
	if (typeof slashCount !== 'number') {
		return;
	}
	Settings.updateValueById('Jitsi_Start_SlashCommands_Count', slashCount + 1);
	console.log(settings.get('Jitsi_Start_SlashCommands_Count'));
}

Meteor.methods({
	jitsiClickToJoinCount() {
		const clickCount = settings.get('Jits_Click_To_Join_Count');
		if (typeof clickCount !== 'number') {
			return;
		}
		Settings.updateValueById('Jits_Click_To_Join_Count', clickCount + 1);
		console.log(settings.get('Jits_Click_To_Join_Count'));
	},
});
