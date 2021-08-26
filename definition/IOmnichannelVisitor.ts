
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

	channels?: Array<IIncomingChannel>;

	ts: Date;
	_updatedAt: Date;
}

export interface IIncomingChannel {
	type: ChannelType;
}

export interface IIncomingChannelWithSource extends IIncomingChannel {
	source: any;
}

export interface IWhatsAppChannel extends IIncomingChannel {
	type: ChannelType.WHATSAPP;
	phoneNumber: string;
	name?: string;
}

export interface IWhatsAppChannelWithSource extends IWhatsAppChannel, IIncomingChannelWithSource {
	type: ChannelType.WHATSAPP;
	source: {
		incomingPhoneNumber: string;
	};
}

export interface ITwitterChannel extends IIncomingChannel {
	type: ChannelType.TWITTER;
	userId: string;
	username?: string;
	name?: string;
	profilePic?: string;
}

export interface ITwitterChannelWithSource extends ITwitterChannel, IIncomingChannelWithSource {
	type: ChannelType.TWITTER;
	source: {
		incomingUserId: string;
	};
}

export interface IFacebookMessengerChannel extends IIncomingChannel {
	type: ChannelType.FACEBOOK_MESSENGER;
	userId: string; // the PSID (Page scoped user ID) of a visitor
	name?: string;
	profilePic?: string;
}

export interface IFacebookMessengerChannelWithSource extends IFacebookMessengerChannel, IIncomingChannelWithSource {
	type: ChannelType.FACEBOOK_MESSENGER;
	source: {
		incomingPageId: string;
	};
}

export interface ITelegramChannel extends IIncomingChannel {
	type: ChannelType.TELEGRAM;
	userId: string;
	firstName?: string;
	lastName?: string;
}

export interface ITelegramChannelWithSource extends ITelegramChannel, IIncomingChannelWithSource {
	type: ChannelType.TELEGRAM;
	source: {
		incomingUserId: string;
	};
}


export interface IInstagramChannel extends IIncomingChannel {
	type: ChannelType.INSTAGRAM;
	userId: string; // IGSID - Instagram (IG)-scoped ID
	name?: string;
	profilePic?: string;
}

export interface IInstagramChannelWithSource extends IInstagramChannel, IIncomingChannelWithSource {
	type: ChannelType.INSTAGRAM;
	source: {
		incomingUserId: string; // note, we can either FB page ID over here or the Instagram Account ID since both of them have one-to-one relationship
	};
}
