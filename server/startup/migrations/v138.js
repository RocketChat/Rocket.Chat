import { Migrations } from '/app/migrations';
import { Settings } from '/app/models';

Migrations.add({
	version: 138,
	up() {
		Settings.remove({ _id: 'InternalHubot_Enabled' });
		Settings.remove({ _id: 'InternalHubot_Username' });
		Settings.remove({ _id: 'InternalHubot_ScriptsToLoad' });
		Settings.remove({ _id: 'InternalHubot_PathToLoadCustomScripts' });
		Settings.remove({ _id: 'InternalHubot_EnableForChannels' });
		Settings.remove({ _id: 'InternalHubot_EnableForPrivateGroups' });
		Settings.remove({ _id: 'InternalHubot_EnableForDirectMessages' });
	},
});
