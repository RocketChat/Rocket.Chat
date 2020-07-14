import * as jwt from 'jsonwebtoken';

import { IScreenSharingProvider } from '../IScreenSharingProvider';
import { ScreensharingManager } from '../ScreenSharingManager';
import { settings } from '../../../../../settings/server';

export class CobrowseProvider implements IScreenSharingProvider {
	config = {
		name: 'Cobrowse.io',
		providerBundle: 'https://ashwaniYDV.github.io/sstest/ssbundle.js',
	}

	getInfo(): any {
		return 'info from cobrowse.io';
	}

	getJWT(agent: any): any {
		const payload = {
			displayName: agent.username,
		};

		const privateKEY = settings.get('Cobrowse.io_Private_Key');

		// Issuer (license key)
		const i = settings.get('Cobrowse.io_License_Key');
		// Subject
		const s = agent.emails[0].address;
		// Audience
		const a = 'https://cobrowse.io';

		// SIGNING OPTIONS
		const signOptions = {
			issuer: i,
			subject: s,
			audience: a,
			expiresIn: '12h',
			algorithm: 'RS256',
		};

		const token = jwt.sign(payload, privateKEY, signOptions);
		console.log('token hai', token);
		return token;
	}

	getURL(sessionId: string, agent: any): string {
		const jwt = this.getJWT(agent);
		console.log(jwt);
		return `https://cobrowse.io/connect?filter_roomId=${ sessionId }&token=${ jwt }`;
	}
}

ScreensharingManager.registerProvider('Cobrowse.io', new CobrowseProvider());
