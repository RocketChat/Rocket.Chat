// backport of rocketchat:user-presence for the desktop app

if (window.RocketChatDesktop) {
	const fakeUserPresenceModule = {
		UserPresence: {
			awayTime: undefined,
			start: () => undefined,
		},
	};

	window.require = ((fn) =>
		Object.assign((id: string) => {
			if (id === 'meteor/rocketchat:user-presence') {
				return fakeUserPresenceModule;
			}
			return fn(id);
		}, fn))(window.require);
}
