import type { DesktopWindow } from './desktopRequire';
import { installDesktopRequire } from './desktopRequire';

const info = { version: '9.0.0', commit: { hash: 'abc123' } };

const createWindow = (overrides: Partial<DesktopWindow> = {}): DesktopWindow => ({ ...overrides });

describe('installDesktopRequire', () => {
	it('does nothing outside the desktop app', () => {
		const target = createWindow();

		installDesktopRequire(target, info);

		expect(target.require).toBeUndefined();
	});

	it.each(['/rocketchat.info', '/app/utils/rocketchat.info'])('returns the server info for %s in the desktop app', (id) => {
		const target = createWindow({ RocketChatDesktop: {} as Window['RocketChatDesktop'] });

		installDesktopRequire(target, info);

		expect(target.require?.(id)).toEqual({ Info: info });
	});

	it('throws a module-not-found error for any other module', () => {
		const target = createWindow({ RocketChatDesktop: {} as Window['RocketChatDesktop'] });

		installDesktopRequire(target, info);

		expect(() => target.require?.('meteor/meteor')).toThrow(expect.objectContaining({ code: 'MODULE_NOT_FOUND' }));
		expect(() => target.require?.('/client/lib/settings/index.ts')).toThrow("Cannot find module '/client/lib/settings/index.ts'");
	});

	it('answers the server info over an existing require that does not know it', () => {
		const existing = jest.fn(() => {
			throw Object.assign(new Error("Cannot find module '/rocketchat.info'"), { code: 'MODULE_NOT_FOUND' });
		});
		const target = createWindow({ RocketChatDesktop: {} as Window['RocketChatDesktop'], require: existing });

		installDesktopRequire(target, info);

		expect(target.require?.('/rocketchat.info')).toEqual({ Info: info });
		expect(existing).not.toHaveBeenCalled();
	});

	it('leaves every other module to the existing require', () => {
		const meteorModule = { Meteor: {} };
		const existing = jest.fn(() => meteorModule);
		const target = createWindow({ RocketChatDesktop: {} as Window['RocketChatDesktop'], require: existing });

		installDesktopRequire(target, info);

		expect(target.require?.('meteor/meteor')).toBe(meteorModule);
		expect(existing).toHaveBeenCalledWith('meteor/meteor');
	});
});
