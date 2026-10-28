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

	it('keeps an existing require function', () => {
		const existing = jest.fn() as DesktopWindow['require'];
		const target = createWindow({ RocketChatDesktop: {} as Window['RocketChatDesktop'], require: existing });

		installDesktopRequire(target, info);

		expect(target.require).toBe(existing);
	});
});
