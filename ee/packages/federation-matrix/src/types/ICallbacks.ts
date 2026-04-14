import type { IMessage, IUser } from '@rocket.chat/core-typings';

export interface ICallbackPriority {
	HIGH: number;
	MEDIUM: number;
	LOW: number;
}

export interface ICallbacks {
	priority: ICallbackPriority;
	add(hook: string, callback: (...args: any[]) => any, priority?: number, id?: string): void;
	remove(hook: string, id: string): void;
}

export interface IFederationCallbackHandlers {
	afterSetReaction?: (message: IMessage, params: { user: IUser; reaction: string }) => Promise<void>;
	afterUnsetReaction?: (message: IMessage, params: { user: IUser; reaction: string; oldMessage: IMessage }) => Promise<void>;
}
