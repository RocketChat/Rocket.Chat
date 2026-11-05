// Rocket.Chat Desktop 4.18 and older reload the workspace when Meteor's `window.require` cannot give them the server
// version, so a build without that `window.require` (the Vite one) provides that one module.
const desktopModuleIds = new Set(['/rocketchat.info', '/app/utils/rocketchat.info']);

export type DesktopWindow = Pick<Window, 'RocketChatDesktop'> & { require?: (id: string) => unknown };

export const installDesktopRequire = (target: DesktopWindow, info: Record<string, unknown>): void => {
	if (!target.RocketChatDesktop || typeof target.require === 'function') {
		return;
	}

	target.require = (id: string) => {
		if (desktopModuleIds.has(id)) {
			return { Info: info };
		}

		// Same failure as Meteor's require for an unknown module, so the desktop's own fallbacks apply.
		throw Object.assign(new Error(`Cannot find module '${id}'`), { code: 'MODULE_NOT_FOUND' });
	};
};
