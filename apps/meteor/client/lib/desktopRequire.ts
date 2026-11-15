// Rocket.Chat Desktop 4.18 and older reload the workspace when `window.require` cannot give them the server version.
// The client is not built by Meteor, so neither Meteor's `window.require`, when the server page still loads it, nor
// the absence of one knows that module: this answers it and leaves every other id to the existing require.
const desktopModuleIds = new Set(['/rocketchat.info', '/app/utils/rocketchat.info']);

export type DesktopWindow = Pick<Window, 'RocketChatDesktop'> & { require?: (id: string) => unknown };

export const installDesktopRequire = (target: DesktopWindow, info: Record<string, unknown>): void => {
	if (!target.RocketChatDesktop) {
		return;
	}

	const fallback = target.require;

	target.require = (id: string) => {
		if (desktopModuleIds.has(id)) {
			return { Info: info };
		}

		if (typeof fallback === 'function') {
			return fallback(id);
		}

		// Same failure as Meteor's require for an unknown module, so the desktop's own fallbacks apply.
		throw Object.assign(new Error(`Cannot find module '${id}'`), { code: 'MODULE_NOT_FOUND' });
	};
};
