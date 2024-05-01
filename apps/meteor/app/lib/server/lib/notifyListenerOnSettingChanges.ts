import { api, dbWatchersDisabled } from '@rocket.chat/core-services';
import type { ISetting } from '@rocket.chat/core-typings';
import { Settings } from '@rocket.chat/models';

type ClientAction = 'inserted' | 'updated' | 'removed';

export async function notifyListenerOnSettingChanges(sid: ISetting['_id'], clientAction: ClientAction = 'updated'): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	const setting = await Settings.findOneById(sid);

	if (setting) {
		void api.broadcast('watch.settings', {
			clientAction,
			setting,
		});
	}
}
