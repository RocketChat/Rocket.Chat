import type { IVisitorEmail } from './IVisitorEmail';
import type { IVisitorPhone } from './IVisitorPhone';

export interface IVisitorExternalIdentifier {
	source: string;
	userId: string;
	username?: string;
}

export interface IVisitor {
	id?: string;
	token: string;
	username: string;
	updatedAt?: Date;
	name: string;
	department?: string;
	phone?: Array<IVisitorPhone>;
	visitorEmails?: Array<IVisitorEmail>;
	status?: string;
	activity?: string[];
	customFields?: { [key: string]: any };
	livechatData?: { [key: string]: any };
	externalIds?: IVisitorExternalIdentifier[];
}
