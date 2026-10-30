import { describe, it } from 'node:test';

import { expect } from 'chai';

import { getSessionDevice } from './getSessionDevice';

describe('getSessionDevice', () => {
	it('describes a browser by its name, version and operating system', () => {
		const device = getSessionDevice(
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.92 Safari/537.36',
		);

		expect(device).to.deep.include({ type: 'browser', name: 'Chrome', longVersion: '130.0.6723.92', version: '130.0.6723' });
		expect(device.os).to.include({ name: 'Windows', version: '10' });
	});

	it('describes the desktop app as the app, not the browser it embeds', () => {
		const device = getSessionDevice(
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Rocket.Chat/2.15.2 Chrome/69.0.3497.128 Electron/4.1.4 Safari/537.36',
		);

		expect(device).to.deep.include({ type: 'desktop-app', name: 'Rocket.Chat', version: '2.15.2' });
	});

	it('describes the mobile app', () => {
		const device = getSessionDevice('RC Mobile; iOS 12.2; v3.4.0 (250)');

		expect(device).to.deep.include({ type: 'mobile-app', name: 'RC Mobile', version: '3.4.0' });
		expect(device.os).to.include({ name: 'iOS', version: '12.2' });
	});

	it('describes a mobile app that reports no version without one', () => {
		expect(getSessionDevice('RC Mobile')).to.deep.include({ type: 'mobile-app', name: 'RC Mobile', longVersion: '', version: '' });
	});
});
