import type { IAppServerOrchestrator } from '@rocket.chat/apps';
import { EmailBridge } from '@rocket.chat/apps/dist/server/bridges/EmailBridge';
import type { IEmail } from '@rocket.chat/apps-engine/definition/email';

import * as Mailer from '../../../mailer/server/api';
import { settings } from '../../../settings/server';

export class AppEmailBridge extends EmailBridge {
	constructor(private readonly orch: IAppServerOrchestrator) {
		super();
	}

	protected async sendEmail(email: IEmail, appId: string): Promise<void> {
		let { from } = email;
		if (!from) {
			this.orch.debugLog(`The app ${appId} didn't provide a from address, using the default one.`);
			from = String(settings.get('From_Email'));
		}

		this.orch.debugLog(`The app ${appId} is sending an email.`);
		await Mailer.send({ ...email, from });
	}
}
