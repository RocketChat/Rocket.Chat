RocketChat.Migrations.add({
	version: 128,
	up() {
		const _id = 'theme-font-body-font-family';
		const oldValue = '-apple-system, BlinkMacSystemFont, Roboto, \'Helvetica Neue\', Arial, sans-serif, \'Apple Color Emoji\', \'Segoe UI\', \'Segoe UI Emoji\', \'Segoe UI Symbol\', \'Meiryo UI\'';
		const newValue = '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen, Ubuntu, Cantarell, \'Helvetica Neue\', \'Apple Color Emoji\', \'Segoe UI Emoji\', \'Segoe UI Symbol\', \'Meiryo UI\', Arial, sans-serif';

		RocketChat.models.Settings.update({ _id, value: oldValue }, {
			$set: {
				value: newValue,
			},
		});
	},
});
