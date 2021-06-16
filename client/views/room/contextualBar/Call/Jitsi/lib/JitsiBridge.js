import { Emitter } from '@rocket.chat/emitter';

import { JitsiMeetExternalAPI } from './Jitsi';

export class JitsiBridge extends Emitter {
	constructor(
		{ openNewWindow, ssl, domain, jitsiRoomName, accessToken, desktopSharingChromeExtId, name },
		heartbeat,
	) {
		super();

		this.openNewWindow = openNewWindow;
		this.ssl = ssl;
		this.domain = domain;
		this.jitsiRoomName = jitsiRoomName;
		this.accessToken = accessToken;
		this.desktopSharingChromeExtId = desktopSharingChromeExtId;
		this.name = name;
		this.heartbeat = heartbeat;
		this.window = undefined;
		this.needsStart = false;
	}

	start(domTarget) {
		if (!this.needsStart) {
			return;
		}

		this.needsStart = false;

		const heartbeatTimer = setInterval(() => this.emit('HEARTBEAT', true), this.heartbeat);
		this.once('dispose', () => clearTimeout(heartbeatTimer));

		const {
			openNewWindow,
			ssl,
			domain,
			jitsiRoomName,
			accessToken,
			desktopSharingChromeExtId,
			name,
		} = this;

		const protocol = ssl ? 'https://' : 'http://';

		const configOverwrite = {
			desktopSharingChromeExtId,
		};

		const interfaceConfigOverwrite = {};

		if (openNewWindow) {
			const queryString = accessToken ? `?jwt=${accessToken}` : '';
			const newWindow = window.open(
				`${protocol + domain}/${jitsiRoomName}${queryString}`,
				jitsiRoomName,
			);

			if (!newWindow) {
				return;
			}

			const timer = setInterval(() => {
				if (newWindow.closed) {
					this.dispose();
				}
			}, 1000);

			this.once('dispose', () => clearTimeout(timer));
			this.window = newWindow;
			return newWindow.focus();
		}

		const width = 'auto';
		const height = 500;

		const api = new JitsiMeetExternalAPI(
			domain,
			jitsiRoomName,
			width,
			height,
			domTarget,
			configOverwrite,
			interfaceConfigOverwrite,
			!ssl,
			accessToken,
		); // eslint-disable-line no-undef
		api.executeCommand('displayName', [name]);
		this.once('dispose', () => api.dispose());
	}

	dispose() {
		clearInterval(this.timer);
		this.emit('dispose', true);
	}
}
