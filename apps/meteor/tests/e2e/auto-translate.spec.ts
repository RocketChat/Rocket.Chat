import type { MongoClient } from 'mongodb';
import { MongoClient as Mongo } from 'mongodb';

import { URL_MONGODB } from './config/constants';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetChannelAndReturnFullRoom, deleteChannel, sendTargetChannelMessage } from './utils';
import { preserveSettings } from './utils/preserveSettings';
import { setSettingValueById } from './utils/setSettingValueById';
import { expect, test } from './utils/test';

test.use({ storageState: Users.admin.state });

const ORIGINAL_MESSAGE = 'Good morning everyone';
const TRANSLATED_MESSAGE = 'Guten Morgen zusammen';

test.describe.serial('auto-translate', () => {
	let poHomeChannel: HomeChannel;
	let targetChannel: string;
	let connection: MongoClient;

	preserveSettings(['AutoTranslate_Enabled']);

	test.beforeAll(async ({ api }) => {
		connection = await Mongo.connect(URL_MONGODB);

		await setSettingValueById(api, 'AutoTranslate_Enabled', true);

		const { channel } = await createTargetChannelAndReturnFullRoom(api);
		targetChannel = channel.name as string;

		await sendTargetChannelMessage(api, targetChannel, { msg: ORIGINAL_MESSAGE });

		await connection
			.db()
			.collection('rocketchat_message')
			.updateOne(
				{ rid: channel._id, msg: ORIGINAL_MESSAGE },
				{ $set: { u: { _id: Users.user1.data._id, username: Users.user1.data.username }, translations: { de: TRANSLATED_MESSAGE } } },
			);

		await api.post('/autotranslate.saveSettings', { roomId: channel._id, field: 'autoTranslateLanguage', value: 'de' });
	});

	test.afterAll(async ({ api }) => {
		await deleteChannel(api, targetChannel);
		await connection.close();
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
	});

	test('should render the translated message once the user enables automatic translation', async () => {
		await poHomeChannel.gotoChannel(targetChannel);

		await expect(poHomeChannel.content.lastUserMessage).toContainText(ORIGINAL_MESSAGE);

		await poHomeChannel.roomToolbar.openMoreOptions();
		await poHomeChannel.roomToolbar.menuItemAutoTranslate.click();
		await poHomeChannel.tabs.autoTranslate.waitForDisplay();
		await poHomeChannel.tabs.autoTranslate.setAutomaticTranslation(true);
		await poHomeChannel.toastMessage.waitForDisplay({ type: 'success' });

		await expect(poHomeChannel.content.lastUserMessage).toContainText(TRANSLATED_MESSAGE);
		await expect(poHomeChannel.content.lastUserMessage).not.toContainText(ORIGINAL_MESSAGE);
	});
});
