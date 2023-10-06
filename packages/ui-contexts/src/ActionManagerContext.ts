import { createContext } from 'react';

type ActionManagerContextValue = {
	on: (...args: any[]) => void;
	off: (...args: any[]) => void;
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

export const ActionManagerContext = createContext<ActionManagerContextValue | undefined>(undefined);
