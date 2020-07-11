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

	getJWT(agentDisplayName: string, agentEmail: string): any {
		const payload = {
			displayName: agentDisplayName,
		};

		const privateKEY = settings.get('Cobrowse.io_Private_Key');

		// Issuer (license key)
		const i = 'GDlHlzhpzAVO9g';
		// Subject
		const s = agentEmail;
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

		return token;
	}

	getURL(sessionId: string): string {
		const jwt = this.getJWT('agent1', 'agent1@gmail.com');
		return `https://cobrowse.io/connect?filter_roomId=${ sessionId }&token=${ jwt }`;
	}
}

ScreensharingManager.registerProvider('Cobrowse.io', new CobrowseProvider());
