import { addLicense } from './license';

export default function init(encryptedLicense) {
	try {
		console.log('#################################################');
		console.log('###           Rocket.Chat Enteprise          ####');
		console.log('#################################################');

		if (!encryptedLicense || encryptedLicense === '') {
			return;
		}

		addLicense(encryptedLicense);
	} catch (e) {
		console.error('license error ->', e);
	}
}
