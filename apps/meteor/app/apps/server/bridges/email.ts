import type { IAppServerOrchestrator } from '@rocket.chat/apps';
import type { IEmail } from '@rocket.chat/apps-engine/definition/email';
import { EmailBridge } from '@rocket.chat/apps-engine/server/bridges';

import * as Mailer from '../../../mailer/server/api';

export class AppEmailBridge extends EmailBridge {
	constructor(private readonly orch: IAppServerOrchestrator) {
		super();
	}

	protected async sendEmail(email: IEmail, appId: string): Promise<void> {
		this.orch.debugLog(`The app ${appId} is sending an email.`);
		await Mailer.send(email);
	}
}
