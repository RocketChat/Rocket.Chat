import type { Page, APIResponse } from '@playwright/test';

import { OmnichannelLiveChat } from './omnichannel-livechat';

export class OmnichannelLiveChatEmbedded extends OmnichannelLiveChat {
	constructor(page: Page, api: { get(url: string): Promise<APIResponse> }) {
		super(page, api, page.frameLocator('#rocketchat-iframe'));
	}
}
