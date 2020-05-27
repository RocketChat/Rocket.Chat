import { Migrations } from '../../migrations';
import { Settings } from '../../../app/models';

Migrations.add({
	version: 96,
	up() {
		if (Settings) {
			Settings.update({ _id: 'InternalHubot_ScriptsToLoad' }, { $set: { value: '' } });
		}
	},
});
