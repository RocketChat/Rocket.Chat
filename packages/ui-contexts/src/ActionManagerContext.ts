import type { IMessage, IRoom, UiKit } from '@rocket.chat/core-typings';
import { createContext } from 'react';

// type BlockActionUserInteractionPayload = {
// 	type: 'blockAction';
// 	actionId: string;
// 	triggerId: string;
// 	mid?: IMessage['_id'];
// 	rid?: IRoom['_id'];
// 	payload: UiKit.View;
// 	container:
// 		| {
// 				type: 'view';
// 				id: UiKit.View['viewId'];
// 		  }
// 		| {
// 				type: 'message';
// 				id: IMessage['_id'];
// 		  };
// };

type BlockActionTriggerOptions =
	| {
			type: 'blockAction';
			actionId: string;
			appId: string;
			container: {
				type: 'view';
				id: UiKit.View['viewId'];
			};
			visitor?: unknown;
	  }
	| {
			type: 'blockAction';
			actionId: string;
			appId: string;
			container: {
				type: 'message';
				id: UiKit.View['viewId'];
			};
			rid: IRoom['_id'];
			mid: IMessage['_id'];
			visitor?: unknown;
	  };

/**
 * Utility type to remove the `type` property from an **union** of objects.
 */
type WithoutType<X> = X extends { type: any } ? Omit<X, 'type'> : X;

type ActionManagerContextValue = {
	on: {
		(viewId: string, listener: (...args: any[]) => any): void;
		(eventName: 'busy', listener: ({ busy }: { busy: boolean }) => void): void;
	};
	off: {
		(viewId: string, listener: (...args: any[]) => any): void;
		(eventName: 'busy', listener?: ({ busy }: { busy: boolean }) => void): void;
	};
	generateTriggerId: (appId: any) => string;
	handlePayloadUserInteraction: (
		type: any,
		{
			triggerId,
			...data
		}: {
			[x: string]: any;
			triggerId: any;
		},
	) => any;
	triggerAction(action: BlockActionTriggerOptions): Promise<void>;
	triggerAction({
		type,
		actionId,
		appId,
		rid,
		mid,
		viewId,
		container,
		tmid,
		...rest
	}: {
		[x: string]: any;
		type: any;
		actionId: any;
		appId: any;
		rid: any;
		mid: any;
		viewId: any;
		container: any;
		tmid: any;
	}): Promise<any>;
	triggerBlockAction(options: WithoutType<BlockActionTriggerOptions>): Promise<void>;
	// triggerBlockAction(options: any): Promise<any>;
	triggerActionButtonAction: (options: any) => Promise<any>;
	triggerSubmitView: ({ viewId, ...options }: { [x: string]: any; viewId: any }) => Promise<void>;
	triggerCancel: ({ view, ...options }: { [x: string]: any; view: any }) => Promise<void>;
	getUserInteractionPayloadByViewId: (viewId: any) => any;
};

export const ActionManagerContext = createContext<ActionManagerContextValue | undefined>(undefined);
