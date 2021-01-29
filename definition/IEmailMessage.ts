import { ParsedMail } from 'mailparser';

export interface IEmailMessage {
	_id: string;
	uid: string;
	email: string;
	department?: string;
	data: ParsedMail;
	locked: boolean;
	lockLimitAt?: Date;
	createdAt: Date;
}
