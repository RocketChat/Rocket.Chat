import Agenda from 'agenda';
import { ParsedMail } from 'mailparser';
import { MongoInternals } from 'meteor/mongo';

import { EmailMessage } from '../../../app/models/server/raw';
import { onEmailReceived } from './EmailInbox_Incoming';

const EMAIL_SCHEDULER_TIMEOUT = 1000;
const EMAIL_SCHEDULER_NAME = 'rocketchat_email_scheduler';
const EMAIL_JOB_NAME = 'check-email-queue';

class EmailQueueManagerClass {
	scheduler: Agenda;

	running: boolean;

	constructor() {
		this.scheduler = new Agenda({
			mongo: (MongoInternals.defaultRemoteCollectionDriver().mongo as any).client.db(),
			db: { collection: EMAIL_SCHEDULER_NAME },
			defaultConcurrency: 1,
		});
		this.running = false;
	}

	public async initWorker(): Promise<void> {
		if (this.running) {
			return;
		}

		this.scheduler.define(EMAIL_JOB_NAME, this.executeWorker.bind(this));
		try {
			await this.scheduler.start();
			await this.scheduler.every(EMAIL_SCHEDULER_TIMEOUT, EMAIL_JOB_NAME);
			this.running = true;
		} catch (error) {
			console.error('Error starting scheduler job: %s', error.message);
		}
	}

	public async stopWorker(): Promise<void> {
		if (!this.running) {
			return;
		}

		await this.scheduler.cancel({ name: EMAIL_JOB_NAME });
		this.running = false;
	}

	async executeWorker(): Promise<void> {
		if (!this.running) {
			return;
		}

		const emailMessage = await EmailMessage.findNextInQueue();
		if (!emailMessage) {
			return;
		}

		const { uid, data, email, department } = emailMessage;

		onEmailReceived(data, email, department)
			.then(async () => {
				await EmailMessage.removeByUid(uid);
			}).catch((error) => {
				console.log('Error receiving Email: %s', error.message);
			});
	}

	scheduleEmailMessage({ email, department, data }: { email: string; department?: string; data: ParsedMail }): void {
		const { messageId } = data;

		if (!messageId) {
			return;
		}

		EmailMessage.insertOrUpdateOne({
			uid: messageId,
			email,
			data,
			...department && { department },
		}).catch((error) => {
			console.error('Error creating new Email Message.', error);
		});
	}
}

export const EmailQueueManager = new EmailQueueManagerClass();
