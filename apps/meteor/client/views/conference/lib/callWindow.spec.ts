import type { IRocketChatDesktop, IVideoCallWindow } from '@rocket.chat/desktop-api';

import { closeCallWindow, setCloseRequestHandler } from './callWindow';

// A hash, because that is the one navigation the test DOM performs: it shows where the fallback went.
jest.mock('../../../lib/absoluteUrl', () => ({ _relativeToSiteRootUrl: (path: string) => `#${path}` }));

const bridge = () => ({ close: jest.fn(), openInMainWindow: jest.fn(), requestScreenSharing: jest.fn() }) satisfies IVideoCallWindow;

describe('closeCallWindow', () => {
	let windowClose: jest.SpyInstance;

	beforeEach(() => {
		jest.useFakeTimers();
		windowClose = jest.spyOn(window, 'close').mockImplementation(() => undefined);
		window.location.hash = '';
	});

	afterEach(() => {
		jest.useRealTimers();
		windowClose.mockRestore();
		delete window.RocketChatDesktop;
		delete window.videoCallWindow;
	});

	it('closes the desktop app 4.18+ call window through RocketChatDesktop.videoCall', () => {
		const videoCall = bridge();
		window.RocketChatDesktop = { videoCall } as unknown as IRocketChatDesktop;

		closeCallWindow();
		jest.runAllTimers();

		expect(videoCall.close).toHaveBeenCalledTimes(1);
		expect(windowClose).not.toHaveBeenCalled();
		expect(window.location.hash).toBe('');
	});

	it('closes an older desktop app call window through videoCallWindow', () => {
		const videoCallWindow = bridge();
		window.videoCallWindow = videoCallWindow;

		closeCallWindow();
		jest.runAllTimers();

		expect(videoCallWindow.close).toHaveBeenCalledTimes(1);
		expect(windowClose).not.toHaveBeenCalled();
		expect(window.location.hash).toBe('');
	});

	it('closes a browser window itself, and leaves the call for home if the browser refuses', () => {
		closeCallWindow();

		expect(windowClose).toHaveBeenCalledTimes(1);
		expect(window.location.hash).toBe('');

		jest.runAllTimers();

		expect(window.location.hash).toBe('#/home');
	});
});

describe('setCloseRequestHandler', () => {
	afterEach(() => {
		delete window.RocketChatDesktop;
	});

	it('hands the handler to the desktop app call window', () => {
		const videoCall = { ...bridge(), setCloseRequestHandler: jest.fn() };
		window.RocketChatDesktop = { videoCall } as unknown as IRocketChatDesktop;
		const handler = () => true;

		setCloseRequestHandler(handler);

		expect(videoCall.setCloseRequestHandler).toHaveBeenCalledWith(handler);
	});

	it('does nothing in a desktop app that predates it, or in a browser', () => {
		window.RocketChatDesktop = { videoCall: bridge() } as unknown as IRocketChatDesktop;

		expect(() => setCloseRequestHandler(() => true)).not.toThrow();

		delete window.RocketChatDesktop;

		expect(() => setCloseRequestHandler(() => true)).not.toThrow();
	});
});
