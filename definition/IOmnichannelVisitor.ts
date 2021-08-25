
export enum ChannelType {
	LIVECHAT = 'livechat',
	EMAIL = 'email',
	SMS = 'sms',
	WHATSAPP = 'whatsapp',
	TWITTER = 'twitter',
	FACEBOOK_MESSENGER = 'facebook-messenger',
	TELEGRAM = 'telegram',
	INSTAGRAM = 'instagram',
	APPLE = 'apple'
}

export interface IOmnichannelVisitor {
	_id: string;
	username: string;
	token: string;

	name?: string;

	channels?: Array<IOmnichannelChannel>;

	ts: Date;
	_updatedAt: Date;
}

export interface IOmnichannelChannel {
	type: ChannelType;
}

export interface IWhatsAppChannel {
	type: ChannelType.WHATSAPP;
	phoneNumber: string;
	name?: string;
}

export interface ITwitterChannel {
	type: ChannelType.TWITTER;
	id: string;
	username?: string;
	name?: string;
	profilePic?: string;
}

export interface IFacebookMessengerChannel {
	type: ChannelType.FACEBOOK_MESSENGER;
	userId: string; // the PSID (Page scoped user ID) of a visitor
	name?: string;
	profilePic?: string;
}

export interface ITelegramChannel {
	userId: string;
	firstName?: string;
	lastName?: string;
}

export interface IInstagramChannel {
	userId: string; // IGSID - Instagram (IG)-scoped ID
	name?: string;
}
