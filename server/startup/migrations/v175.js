import { Migrations } from '../../migrations';
import { theme } from '../../../app/theme/server/server';
import { Settings } from '../../../app/models';

Migrations.add({
	version: 175,
	up() {
		Object.entries(theme.variables)
			.filter(([, value]) => value.type === 'color')
			.forEach(([key, { editor }]) => {
				Settings.update({ _id: `theme-color-${ key }` }, {
					$set: {
						packageEditor: editor,
					},
				});
			});
	},
});
