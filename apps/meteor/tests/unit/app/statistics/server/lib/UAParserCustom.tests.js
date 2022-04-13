import { expect } from 'chai';

import { UAParserMobile, UAParserDesktop } from '../../../../../../app/statistics/server/lib/UAParserCustom';

const UAMobile = 'RC Mobile; iOS 12.2; v3.4.0 (250)';
const UADesktop =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Rocket.Chat/2.15.2 Chrome/69.0.3497.128 Electron/4.1.4 Safari/537.36';
const UAChrome =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.131 Safari/537.36';

describe('UAParserCustom', () => {
	describe('UAParserMobile', () => {
		it('should identify mobile UA', () => {
			expect(UAParserMobile.isMobileApp(UAMobile)).to.be.true;
		});

		it('should not identify desktop UA', () => {
			expect(UAParserMobile.isMobileApp(UADesktop)).to.be.false;
		});

		it('should not identify chrome UA', () => {
			expect(UAParserMobile.isMobileApp(UAChrome)).to.be.false;
		});

		it('should parse mobile UA', () => {
			expect(UAParserMobile.uaObject(UAMobile)).to.be.deep.equal({
				device: {
					type: 'mobile-app',
				},
				app: {
					name: 'RC Mobile',
					version: '3.4.0',
					bundle: '250',
				},
				os: {
					name: 'iOS',
					version: '12.2',
				},
			});
		});
	});

	describe('UAParserDesktop', () => {
		it('should not identify mobile UA', () => {
			expect(UAParserDesktop.isDesktopApp(UAMobile)).to.be.false;
		});

		it('should identify desktop UA', () => {
			expect(UAParserDesktop.isDesktopApp(UADesktop)).to.be.true;
		});

		it('should not identify chrome UA', () => {
			expect(UAParserDesktop.isDesktopApp(UAChrome)).to.be.false;
		});

		it('should parse desktop UA', () => {
			expect(UAParserDesktop.uaObject(UADesktop)).to.be.deep.equal({
				device: {
					type: 'desktop-app',
				},
				app: {
					name: 'Rocket.Chat',
					version: '2.15.2',
				},
				os: {
					name: 'Mac OS',
					version: '10.14.1',
				},
			});
		});
	});
});
