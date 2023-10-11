import type { DistributiveOmit, UiKit } from '@rocket.chat/core-typings';
import { createContext } from 'react';

type ActionManager = {
	on(viewId: string, listener: (data: any) => void): void;
	on(eventName: 'busy', listener: ({ busy }: { busy: boolean }) => void): void;
	off(viewId: string, listener: (data: any) => any): void;
	off(eventName: 'busy', listener: ({ busy }: { busy: boolean }) => void): void;
	generateTriggerId(appId: string | undefined): string;
	emitInteraction(appId: string, userInteraction: DistributiveOmit<UiKit.UserInteraction, 'triggerId'>): Promise<unknown>;
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
	triggerAction: ({
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
	}) => Promise<any>;
	triggerBlockAction: (options: any) => Promise<any>;
	triggerActionButtonAction: (options: any) => Promise<any>;
	triggerSubmitView: ({ viewId, ...options }: { [x: string]: any; viewId: any }) => Promise<void>;
	triggerCancel: ({ view, ...options }: { [x: string]: any; view: any }) => Promise<void>;
	getUserInteractionPayloadByViewId: (viewId: any) => any;
};

export const ActionManagerContext = createContext<ActionManager | undefined>(undefined);
