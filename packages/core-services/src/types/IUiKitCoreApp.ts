import type { IUser } from '@rocket.chat/core-typings';

import type { IServiceClass } from './ServiceClass';

// TODO: Fix this type to match `UiKit.UserInteraction` from `@rocket.chat/core-typings`
export type UiKitCoreAppPayload = {
	appId: string;
	type: 'blockAction' | 'viewClosed' | 'viewSubmit';
	actionId?: string;
	triggerId?: string;
	container?: {
		id: string;
		[key: string]: unknown;
	};
	message?: unknown;
	payload: {
		blockId?: string;
		value?: unknown;
		view?: {
			viewId?: string;
			id?: string;
			state?: { [blockId: string]: { [key: string]: unknown } };
			[key: string]: unknown;
		};
		isCleared?: unknown;
	};
	user?: IUser;
	visitor?: {
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
	};
	room?: unknown;
};

export interface IUiKitCoreApp {
	appId: string;

	blockAction?(payload: UiKitCoreAppPayload): Promise<unknown>;
	viewClosed?(payload: UiKitCoreAppPayload): Promise<unknown>;
	viewSubmit?(payload: UiKitCoreAppPayload): Promise<unknown>;
}

export interface IUiKitCoreAppService extends IServiceClass {
	isRegistered(appId: string): Promise<boolean>;
	blockAction(payload: UiKitCoreAppPayload): Promise<unknown>;
	viewClosed(payload: UiKitCoreAppPayload): Promise<unknown>;
	viewSubmit(payload: UiKitCoreAppPayload): Promise<unknown>;
}
