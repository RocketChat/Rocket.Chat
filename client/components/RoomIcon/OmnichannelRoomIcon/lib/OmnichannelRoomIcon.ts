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
		APIClient.get(`apps/public/${appId}/get-sidebar-icon`, { icon }).then((response) => {
			this.icons.set(
				`${appId}-${icon}`,
				DOMPurify.sanitize(response, {
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
	}
})();

export default OmnichannelRoomIcon;
