import type { IEmail } from '@rocket.chat/apps-engine/definition/email/index.js';

import { EmailBridge } from '../../../src/server/bridges/EmailBridge.js';

export class TestsEmailBridge extends EmailBridge {
	protected sendEmail(email: IEmail, appId: string): Promise<void> {
		throw new Error('Method not implemented.');
	}
}
