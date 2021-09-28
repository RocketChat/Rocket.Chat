import { addMigration } from '../../lib/migrations';
import { theme } from '../../../app/theme/server/server';
import { Settings } from '../../../app/models';

addMigration({
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
