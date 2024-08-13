import type { IAppServerOrchestrator } from '@rocket.chat/apps';
import { EmailBridge } from '@rocket.chat/apps-engine/server/bridges/EmailBridge';
import type { IEmail } from '@rocket.chat/apps-engine/server/definitions/email';

import * as Mailer from '../../../mailer/server/api';

export class AppEmailBridge extends EmailBridge {
	constructor(private readonly orch: IAppServerOrchestrator) {
		super();
	}

	protected async sendEmail(email: IEmail, appId: string): Promise<void> {
		this.orch.debugLog(`The app: ${appId} is requesting an OTP code to be sent to: ${email}`);
		await Mailer.send(email);
	}
}
