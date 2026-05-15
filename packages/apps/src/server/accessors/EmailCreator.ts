import type { IEmailCreator } from '@rocket.chat/apps-engine/definition/accessors/IEmailCreator';
import type { IEmail } from '@rocket.chat/apps-engine/definition/email';

import type { AppBridges } from '../bridges';

export class EmailCreator implements IEmailCreator {
	constructor(
		private readonly bridges: AppBridges,
		private readonly appId: string,
	) {}

	public async send(email: IEmail): Promise<void> {
		return this.bridges.getEmailBridge().doSendEmail(email, this.appId);
	}
}
