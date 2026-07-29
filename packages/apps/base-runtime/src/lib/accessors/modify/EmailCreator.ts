import type { IEmailCreator } from '@rocket.chat/apps-engine/definition/accessors/IEmailCreator';
import type { IEmail } from '@rocket.chat/apps-engine/definition/email';

import type { RemoteBridges } from '../../bridges/RemoteBridges';

export class EmailCreator implements IEmailCreator {
	constructor(private readonly bridges: RemoteBridges) {}

	public async send(email: IEmail): Promise<void> {
		await this.bridges.getEmailBridge().doSendEmail(email, 'APP_ID');
	}
}
