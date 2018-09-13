export class Utilities {
	static getI18nKeyForApp(key, appId) {
		return key && `apps-${ appId }-${ key }`;
	}
}
