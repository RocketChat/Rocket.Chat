import * as fs from 'fs';

import * as jwt from 'jsonwebtoken';

import { IScreenSharingProvider } from './IScreenSharingProvider';
import { ScreensharingManager } from '../ScreenSharingManager';

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

		// const privateKEY = fs.readFileSync('/private.key', 'utf8');
		const privateKEY =		`-----BEGIN RSA PRIVATE KEY-----
MIIBOgIBAAJBAIsml8Deo6+NFqI7GJDM22UpmIz9Gg6jzqLv1h4F5dtt4AnDDSyf
U2cz6/uzOsIusDjyxOdDNuolDAx/HunrlKcCAwEAAQJAawUPicKx2X6Ffdg9mIA1
7KQFM8ollETf0+jpoMWgdxXnBAfeOmqM8v7Y/TWrR9lS6J+Qz/lcSqDcULvV0x9d
AQIhAP4zMKgpnEkvoN4ot7DJ/Kc8flPAAbKli6EoIUNAQ2iHAiEAjCLX3QGBKfaA
+RTVQurTFcup94uGHzeM+CPaVzA5GuECIC8BmlLOdwcVlqLeVrGLeHwYdKfaDrZR
ZJOljxkXjh+LAiA9+29U3kR+Bfy3ruJAzdJ9cm6EAh9ZkV11p438QGURoQIhAIW4
sFkfqRULctQzQ10siMhOSQD4gN1SZDidvntas/1o
-----END RSA PRIVATE KEY-----`;
		// const publicKEY = fs.readFileSync('./public.key', 'utf8');

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
}

ScreensharingManager.registerProvider('Cobrowse.io', new CobrowseProvider());
