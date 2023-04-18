import { Meteor } from 'meteor/meteor';

const promisifiedAsset = (name: string) =>
	new Promise<string>((resolve, reject) => {
		Assets.getText(name, (err: any, data: string) => {
			if (err) {
				reject(err);
			} else {
				resolve(data);
			}
		});
	});

export async function getMomentLocale(locale: string): Promise<string | undefined> {
	const localeLower = locale.toLowerCase();

	try {
		return promisifiedAsset(`moment-locales/${localeLower}.js`);
	} catch (error) {
		try {
			return promisifiedAsset(`moment-locales/${String(localeLower.split('-').shift())}.js`);
		} catch (error) {
			throw new Meteor.Error('moment-locale-not-found', `Moment locale not found: ${locale}`);
		}
	}
}
