import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import type * as UiKit from '@rocket.chat/ui-kit';

import type { IServiceClass } from './ServiceClass';

export type UiKitCoreAppBlockActionPayload = Pick<
	UiKit.ViewBlockActionUserInteraction | UiKit.MessageBlockActionUserInteraction,
	'type' | 'actionId' | 'triggerId' | 'container' | 'payload'
> & {
	appId: string;
	message: IMessage['_id'] | undefined;
	user: IUser | undefined;
	visitor:
		| {
				id: string;
				username: string;
				name?: string;
				department?: string;
				updatedAt?: Date;
				token: string;
				phone?: { phoneNumber: string }[] | null;
				visitorEmails?: { address: string }[];
				livechatData?: Record<string, unknown>;
				status?: 'online' | 'away' | 'offline' | 'busy' | 'disabled';
		  }
		| undefined;
	room: IRoom['_id'] | undefined;
};

export type UiKitCoreAppViewClosedPayload = Pick<UiKit.ViewClosedUserInteraction, 'type' | 'triggerId'> & {
	appId: string;
	user: IUser | undefined;
	payload: {
		view: UiKit.View & {
			viewId?: string;
			id?: string;
			state: { [blockId: string]: { [key: string]: unknown } };
		};
		isCleared?: boolean;
	};
};

export type UiKitCoreAppViewSubmitPayload = Pick<UiKit.ViewSubmitUserInteraction, 'type' | 'actionId' | 'triggerId' | 'payload'> & {
	appId: string;
	user: IUser | undefined;
};

export interface IUiKitCoreApp {
	appId: string;

	blockAction?(payload: UiKitCoreAppBlockActionPayload): Promise<UiKit.ServerInteraction | undefined>;
	viewClosed?(payload: UiKitCoreAppViewClosedPayload): Promise<UiKit.ServerInteraction | undefined>;
	viewSubmit?(payload: UiKitCoreAppViewSubmitPayload): Promise<UiKit.ServerInteraction | undefined>;
}

export interface IUiKitCoreAppService extends IServiceClass {
	isRegistered(appId: string): Promise<boolean>;
	blockAction(payload: UiKitCoreAppBlockActionPayload): Promise<UiKit.ServerInteraction | undefined>;
	viewClosed(payload: UiKitCoreAppViewClosedPayload): Promise<UiKit.ServerInteraction | undefined>;
	viewSubmit(payload: UiKitCoreAppViewSubmitPayload): Promise<UiKit.ServerInteraction | undefined>;
}
