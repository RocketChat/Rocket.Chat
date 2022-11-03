import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 280,
	async up() {
		const oldValue = `<p>Welcome to Rocket.Chat!</p>\n<p>The Rocket.Chat desktops apps for Windows, macOS and Linux are available to download <a title="Rocket.Chat desktop apps" href="https://rocket.chat/download" target="_blank" rel="noopener">here</a>.</p><p>The native mobile app, Rocket.Chat,\n  for Android and iOS is available from <a title="Rocket.Chat on Google Play" href="https://play.google.com/store/apps/details?id=chat.rocket.android" target="_blank" rel="noopener">Google Play</a> and the <a title="Rocket.Chat on the App Store" href="https://itunes.apple.com/app/rocket-chat/id1148741252" target="_blank" rel="noopener">App Store</a>.</p>\n<p>For further help, please consult the <a title="Rocket.Chat Documentation" href="https://rocket.chat/docs/" target="_blank" rel="noopener">documentation</a>.</p>\n<p>If you\'re an admin, feel free to change this content via <strong>Administration</strong> &rarr; <strong>Layout</strong> &rarr; <strong>Home Body</strong>. Or clicking <a title="Home Body Layout" href="/admin/Layout">here</a>.</p>`;
		const newValue = `<p>~~~~ Default html example ~~~~</p>\n<strong>Welcome to (ENTER ORGANIZATION NAME HERE)</strong>\n\n<p>All general communications should be done through #general</p>\n<p>find more information <a href="INSERT LINK" target="_blank" rel="noopener">here</a></p>`;

		await Settings.updateOne(
			{
				_id: 'Layout_Home_Body',
				value: oldValue,
			},
			{
				$set: {
					value: newValue,
				},
			},
		);

		await Settings.updateOne(
			{
				_id: 'Layout_Home_Body',
			},
			{
				$set: {
					packageValue: newValue,
				},
			},
		);
	},
});
