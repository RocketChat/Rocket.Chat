import type { Page } from '@playwright/test';

import { OmnichannelRoomInfo } from './omnichannel-room-info';

export class OmnichannelContextualBar {
	private readonly page: Page;

	readonly roomInfo: OmnichannelRoomInfo;

	constructor(page: Page) {
		this.page = page;
		this.roomInfo = new OmnichannelRoomInfo(this.page);
	}
}
