import { Emitter } from '@rocket.chat/emitter';
import DOMPurify from 'dompurify';

import { APIClient } from '../../../../../app/utils/client';

const OmnichannelRoomIcon = new (class extends Emitter {
	icons = new Map<string, string>();

	constructor() {
		super();
	}

	public get(appId: string, icon: string): string | undefined {
		if (!appId || !icon) {
			return;
		}

		if (this.icons.has(`${appId}-${icon}`)) {
			return `${appId}-${icon}`;
		}
		// TODO: update the apps icons to send JSON instead of a string. This will allow us to use APIClient.get()
		APIClient.send(`/apps/public/${appId}/get-sidebar-icon?icon=${icon}`, 'GET')
			.then((response: any) => {
				response.text().then((text: any) => {
					this.icons.set(
						`${appId}-${icon}`,
						DOMPurify.sanitize(text, {
							FORBID_ATTR: ['id'],
							NAMESPACE: 'http://www.w3.org/2000/svg',
							USE_PROFILES: { svg: true, svgFilters: true },
						})
							.replace(`<svg`, `<symbol id="${appId}-${icon}"`)
							.replace(`</svg>`, '</symbol>'),
					);
					this.emit('change');
					this.emit(`${appId}-${icon}`);
				});
			})
			.catch((error: any) => {
				console.error('error from get-sidebar-icon', error);
			});
	}
})();

export default OmnichannelRoomIcon;
