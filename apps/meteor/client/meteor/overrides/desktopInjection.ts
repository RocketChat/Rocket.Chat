import * as rocketChatInfo from '../../../rocketchat.info';
import { PublicSettings } from '../../stores';
import { watch } from '../watch';

if (window.RocketChatDesktop) {
	// backport of rocketchat:user-presence for the desktop app
	const fakeUserPresenceModule = {
		UserPresence: {
			awayTime: undefined,
			start: () => undefined,
		},
	};

	// backport of settings module for the desktop app
	const fakeSettingsModule = {
		settings: {
			get: (settingId: string) => watch(PublicSettings.use, (state) => state.get(settingId)?.value),
		},
	};

	window.require = ((fn) =>
		Object.assign((id: string) => {
			if (id === 'meteor/rocketchat:user-presence') {
				return fakeUserPresenceModule;
			}

			if (id === '/app/settings/client/index.ts') {
				return fakeSettingsModule;
			}

			// desktop app 4.18.2 and earlier load the server version only from its old path in app/utils
			if (id === '/app/utils/rocketchat.info') {
				return rocketChatInfo;
			}

			return fn(id);
		}, fn))(window.require);
}
