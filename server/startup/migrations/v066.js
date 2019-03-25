import { Migrations } from '../../../app/migrations';
import { Settings } from '../../../app/models';

Migrations.add({
	version: 66,
	up() {
		if (Settings) {

			// New color settings - start with old settings as defaults
			const replace1 = Settings.findOne({ _id: 'theme-color-tertiary-background-color' });
			if (replace1) {
				Settings.upsert({ _id: 'theme-color-component-color' }, { $set: { value: replace1.value } });
			}
		}
	},
});
