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

			return fn(id);
		}, fn))(window.require);
}
