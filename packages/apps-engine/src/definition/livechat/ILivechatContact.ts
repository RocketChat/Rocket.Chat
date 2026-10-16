import type { IOmnichannelSource, OmnichannelSourceType } from './ILivechatRoom';
import type { IVisitorEmail } from './IVisitorEmail';
import type { IVisitorPhone } from './IVisitorPhone';

/** Points at one visitor record, which only a source and an id together identify. */
export interface ILivechatContactVisitorAssociation {
	/** The visitor's identifier. */
	visitorId: string;
	/** The channel that visitor record came from. */
	source: {
		type: OmnichannelSourceType;
		id?: IOmnichannelSource['id'];
	};
}

/** One way a contact reaches the workspace, and the visitor record behind it. */
export interface ILivechatContactChannel {
	/** The channel's name, shown to the agent. */
	name: string;
	/** Whether the workspace proved the contact owns this channel. */
	verified: boolean;
	/** The visitor record this channel's conversations come in as. */
	visitor: ILivechatContactVisitorAssociation;
	/** Whether the workspace refuses conversations over this channel. */
	blocked: boolean;
	/** Which contact detail was checked to verify the channel, `phone` or `email`. */
	field?: string;
	/** The value of that detail. */
	value?: string;
	/** When the channel was verified. */
	verifiedAt?: Date;
	/** Where the channel's conversations come from. */
	details: IOmnichannelSource;
	/** The last conversation over this channel. */
	lastChat?: {
		_id: string;
		ts: Date;
	};
}

/**
 * A value two merged visitor records disagreed on.
 *
 * The contact keeps the value it already had and records the other here, for
 * an agent to settle.
 */
export interface ILivechatContactConflictingField {
	/** Which field the two records disagreed on. */
	field: 'name' | 'manager' | `customFields.${string}`;
	/** The value that was not kept. */
	value: string;
}

/**
 * The person behind one or more Livechat visitors.
 *
 * The same person reaching the workspace over the widget and over WhatsApp is
 * two visitor records but one contact, so an agent sees a single history.
 */
export interface ILivechatContact {
	/** The contact's identifier. */
	_id: string;
	/** When the contact last changed. */
	_updatedAt: Date;
	/** The contact's name. */
	name: string;
	/** The phone numbers the contact reaches the workspace from. */
	phones?: IVisitorPhone[];
	/** The email addresses the contact reaches the workspace from. */
	emails?: IVisitorEmail[];
	/** The agent who owns the relationship with this contact. */
	contactManager?: string;
	/** Whether the workspace created the contact from a conversation rather than being told about them. */
	unknown?: boolean;
	/** The values a merge could not settle. */
	conflictingFields?: ILivechatContactConflictingField[];
	/** The values filled into the workspace's custom contact fields. */
	customFields?: Record<string, string | unknown>;
	/** Every way the contact reaches the workspace. */
	channels: ILivechatContactChannel[];
	/** When the contact was created. */
	createdAt: Date;
	/** The contact's last conversation, over any channel. */
	lastChat?: {
		_id: string;
		ts: Date;
	};
	/** The contact's ids in the systems they were imported from. */
	importIds?: string[];
}
