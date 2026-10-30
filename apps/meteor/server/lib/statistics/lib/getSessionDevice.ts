import type { ISessionDevice } from '@rocket.chat/core-typings';
import UAParser from 'ua-parser-js';

import { UAParserMobile, UAParserDesktop } from './UAParserCustom';

/** Describes the client a user agent belongs to: a browser, or one of the Rocket.Chat desktop and mobile apps. */
export const getSessionDevice = (uaString: string): ISessionDevice => {
	// TODO define a type for "result" below
	// | UAParser.IResult
	// | { device: { type: string; model?: string }; browser: undefined; os: undefined; app: { name: string; version: string } }
	// | {
	// 		device: { type: string; model?: string };
	// 		browser: undefined;
	// 		os: string;
	// 		app: { name: string; version: string };
	//   }

	const result = ((): any => {
		if (UAParserMobile.isMobileApp(uaString)) {
			return UAParserMobile.uaObject(uaString);
		}

		if (UAParserDesktop.isDesktopApp(uaString)) {
			return UAParserDesktop.uaObject(uaString);
		}

		const ua = new UAParser(uaString);
		return ua.getResult();
	})();

	const info: ISessionDevice = {
		type: 'other',
		name: '',
		longVersion: '',
		os: {
			name: '',
			version: '',
		},
		version: '',
	};

	const removeEmptyProps = (obj: any): any => {
		Object.keys(obj).forEach((p) => (!obj[p] || obj[p] === undefined) && delete obj[p]);
		return obj;
	};

	if (result.browser?.name) {
		info.type = 'browser';
		info.name = result.browser.name;
		info.longVersion = result.browser.version || '';
	}

	if (typeof result.os !== 'string' && result.os?.name) {
		info.os = removeEmptyProps(result.os) || '';
	}

	if (result.device && (result.device.type || result.device.model)) {
		info.type = result.device.type || '';

		if (result.hasOwnProperty('app') && result.app?.name) {
			info.name = result.app.name;
			info.longVersion = result.app.version;
			if (result.app.bundle) {
				info.longVersion += ` ${result.app.bundle}`;
			}
		}
	}

	if (typeof info.longVersion === 'string') {
		info.version = info.longVersion.match(/(\d+\.){0,2}\d+/)?.[0] || '';
	}

	return info;
};
