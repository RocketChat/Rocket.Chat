import type { IVisitorEmail } from './IVisitorEmail';
import type { IVisitorPhone } from './IVisitorPhone';

/** How an App recognises a visitor in the system the visitor came from. */
export interface IVisitorExternalIdentifier {
	/** The App this identifier belongs to. */
	appId: string;
	/** The visitor's id in that App's own system. */
	entityId: string;
	/** Whatever else the App needs to keep with the identifier. */
	metadata?: Record<string, unknown>;
}

/** The one contact detail a visitor is looked up by. */
export type ResolveVisitorContactData = { phone: string } | { email: string };

/**
 * Someone talking to the workspace from outside it, through Livechat.
 *
 * A visitor has no workspace account, so it is not an `IUser`: it is
 * identified by {@link IVisitor.token} rather than by a login.
 */
export interface IVisitor {
	/** The visitor's identifier, once the workspace has stored them. */
	id?: string;
	/** The token the visitor's client holds, which is what identifies them across conversations. */
	token: string;
	/** The visitor's generated username. */
	username: string;
	/** When the visitor record last changed. */
	updatedAt?: Date;
	/** The name the visitor gave. */
	name: string;
	/** The department the visitor's conversations are routed to. */
	department?: string;
	/** The phone numbers the visitor can be reached at. */
	phone?: Array<IVisitorPhone>;
	/** The email addresses the visitor can be reached at. */
	visitorEmails?: Array<IVisitorEmail>;
	/** The visitor's presence. */
	status?: string;
	/** The months the visitor was active in, as `YYYY-MM`. */
	activity?: string[];
	/** The values filled into the workspace's custom visitor fields. */
	customFields?: { [key: string]: any };
	/** The Livechat data carried with the visitor. */
	livechatData?: { [key: string]: any };
	/** How Apps recognise this visitor in the systems they talk to. */
	externalIds?: IVisitorExternalIdentifier[];
}
