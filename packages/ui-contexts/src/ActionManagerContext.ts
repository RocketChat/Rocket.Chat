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
	getUserInteractionPayloadByViewId: (viewId: any) => any;
	disposeView(viewId: UiKit.View['viewId']): void;
};

export const ActionManagerContext = createContext<ActionManager | undefined>(undefined);
