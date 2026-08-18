import type { Branded } from '@rocket.chat/core-typings';
import { createContext, useContext } from 'react';

export type AppActionUpdate = {
	actionId?: string;
	label?: string;
	variant?: 'default' | 'danger';
	disabled?: boolean;
};

export type MediaCallWidgetState = 'calling' | 'ringing' | 'ongoing';

export type MediaCallAppActionDescriptor = {
	appId: string;
	actionId: string;
	label: string;
	variant?: 'danger';
	callStates?: MediaCallWidgetState[];
};

export const brandMediaCallAppAction = (appId: string, actionId: string): MediaCallAppAction['key'] =>
	`${appId}-${actionId}` as MediaCallAppAction['key'];

export type MediaCallAppAction = {
	key: Branded<string, 'MediaCallAppAction'>;
	disabled: boolean;
} & MediaCallAppActionDescriptor;

export type AppButtonInteractionHandler = (interaction: {
	button: Pick<MediaCallAppActionDescriptor, 'appId' | 'actionId'>;
	sessionState: { callId: string; roomId?: string };
}) => Promise<{ update: AppActionUpdate } | void>;

export type MediaCallAppActionsContextValue = {
	actions: MediaCallAppAction[];
	handleInteraction: AppButtonInteractionHandler;
};

export const defaultMediaCallAppActionsContextValue: MediaCallAppActionsContextValue = {
	actions: [],
	handleInteraction: () => Promise.resolve(),
};

const MediaCallAppActionsContext = createContext<MediaCallAppActionsContextValue>(defaultMediaCallAppActionsContextValue);

export const useMediaCallAppActions = () => useContext(MediaCallAppActionsContext);

export default MediaCallAppActionsContext;
