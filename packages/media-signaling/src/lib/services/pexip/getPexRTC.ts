import type { IPexRTC } from '../../../definition/services/pexip/IPexRTC';

export async function getPexRTC(nodeDomain: string): Promise<IPexRTC> {
	let pexRTC: IPexRTC | null = null;

	return new Promise((resolve, reject) => {
		const pexRTCId = 'pexrtc-library';
		const pexRTCScript = document.getElementById(pexRTCId);
		if (pexRTCScript) {
			pexRTCScript.remove();
		}

		const script = document.createElement('script');
		script.id = pexRTCId;
		script.type = 'text/javascript';
		script.src = `https://${nodeDomain}/static/webrtc/js/pexrtc.js`;

		script.onload = function () {
			console.log('pexRTC script loaded');
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			pexRTC = new (window as any).PexRTC();

			console.log('pexRTC instantiated');
			resolve(pexRTC as IPexRTC);
		};
		script.onerror = (err) => {
			console.error(err);
			reject(new Error('Cannot get PexRTC'));
		};
		document.body.appendChild(script);
		window.addEventListener('beforeunload', (_event) => {
			if (pexRTC) {
				pexRTC.disconnect();
				pexRTC = null;
			}
		});
	});
}
