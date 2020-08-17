import fs from 'fs';

import { KJUR, KEYUTIL } from 'jsrsasign';

import { IScreenSharingProvider } from '../IScreenSharingProvider';
import { ScreenSharingManager } from '../ScreenSharingManager';
import { settings } from '../../../../../settings/server';

// eslint-disable-next-line @typescript-eslint/camelcase
declare let __meteor_runtime_config__: any;

let script = `const loadSDKScript = () => {
	(function(w, t, c, p, s, e) {
		p = new Promise(function(r) {
			w[c] = { client() {
				if (!s) {
					s = document.createElement(t); s.src = 'https://js.cobrowse.io/CobrowseIO.js'; s.async = 1;
					e = document.getElementsByTagName(t)[0]; e.parentNode.insertBefore(s, e); s.onload = function() { r(w[c]); };
				} return p;
			} };
		});
	}(window, 'script', 'CobrowseIO'));
	CobrowseIO.license = '#COBROWSE_LICENSE_KEY';
};
loadSDKScript();
const onStartScreenSharing = (roomId) => {
	CobrowseIO.client().then(function() {
		CobrowseIO.start();
		CobrowseIO.customData = {
			roomId,
		};
	});
};
const onEndScreenSharing = (roomId) => {
	if (CobrowseIO.currentSession) { CobrowseIO.currentSession.end(); }
};
window.addEventListener('message', (msg) => {
	console.log(msg);
	if (typeof msg.data === 'object' && msg.data.src !== undefined && msg.data.src === 'rocketchat') {
		if (msg.data.fn !== undefined && msg.data.fn === 'callback') {
			const { args } = msg.data;
			if (args[0] === 'start-screen-sharing') {
				onStartScreenSharing(args[1].roomId);
			} else if (args[0] === 'end-screen-sharing') {
				onEndScreenSharing(args[1].roomId);
			}
		}
	}
}, false);
const onFinishScreenSharing = () => {
	if (CobrowseIO.currentSession) { CobrowseIO.currentSession.end(); }
	CobrowseIO.client().then(function() {
		CobrowseIO.stop();
	});
};
const setMetaData = (guest_id) => {
	CobrowseIO.customData = {
		guest_id,
	};
};
const endSession = () => {
	if (CobrowseIO.currentSession) { CobrowseIO.currentSession.end(); }
};
`;

export class CobrowseProvider implements IScreenSharingProvider {
	config = {
		name: 'Cobrowse.io',
		// eslint-disable-next-line @typescript-eslint/camelcase
		providerBundle: `${ __meteor_runtime_config__.ROOT_URL }/livechat/screenSharingBundle.js`,
	}

	getJWT(agent: any): any {
		const header = { alg: 'RS256', typ: 'JWT' };
		const privateKEY: any = settings.get('Cobrowse.io_Private_Key');
		const i = settings.get('Cobrowse.io_License_Key');
		const s = agent.emails[0].address;
		const a = 'https://cobrowse.io';
		const payload = {
			iat: KJUR.jws.IntDate.get('now'),
			iss: i,
			sub: s,
			aud: a,
			exp: KJUR.jws.IntDate.get('now + 1day'),
			displayName: agent.username,
		};
		const pKey: any = KEYUTIL.getKey(privateKEY);
		return KJUR.jws.JWS.sign('RS256', JSON.stringify(header), JSON.stringify(payload), pKey);
	}

	getURL(sessionId: string, agent: any): string {
		const jwt = this.getJWT(agent);
		return `https://cobrowse.io/connect?filter_roomId=${ sessionId }&token=${ jwt }`;
	}

	setupBundle(): void {
		let key = settings.get('Cobrowse.io_License_Key') || '';
		key = key.toString();
		script = script.replace('#COBROWSE_LICENSE_KEY', key);
		fs.writeFileSync('../../../../../public/livechat/screenSharingBundle.js', script, {
			encoding: 'utf8',
			flag: 'w',
		});
	}
}

ScreenSharingManager.registerProvider('Cobrowse.io', new CobrowseProvider());
