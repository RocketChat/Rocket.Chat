import { addMigration } from '../../lib/migrations';
import { theme } from '../../../app/theme/server/server';
import { Settings } from '../../../app/models/server/raw';

addMigration({
	version: 175,
	up() {
		Promise.await(
			Promise.all(
				Object.entries(theme.variables)
					.filter(([, value]) => value.type === 'color')
					.map(([key, { editor }]) =>
						Settings.update(
							{ _id: `theme-color-${key}` },
							{
								$set: {
									packageEditor: editor,
								},
							},
						),
					),
			),
		);
	},
});
