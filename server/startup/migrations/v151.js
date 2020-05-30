import { Migrations } from '../../migrations';
import { Settings } from '../../../app/models';

Migrations.add({
	version: 151,
	up() {
		const setting = Settings.findOne({ _id: 'Layout_Sidenav_Footer' });
		if (setting && setting.value) {
			if (setting.value === '<a href="/home"><img src="assets/logo"/></a>') {
				Settings.update({ _id: 'Layout_Sidenav_Footer' }, { $set: { value: '<a href="/home"><img src="assets/logo.png"/></a>' } });
			}
		}
	},
});
