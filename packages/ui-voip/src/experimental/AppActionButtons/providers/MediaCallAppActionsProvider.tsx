import { useMemo, type ReactNode } from 'react';

import MediaCallAppActionsContext, {
	brandMediaCallAppAction,
	type AppButtonInteractionHandler,
	type MediaCallAppActionDescriptor,
	type MediaCallAppActionsContextValue,
} from '../context/MediaCallAppActionsContext';

export type MediaCallAppActionsProviderProps = {
	children: ReactNode;
	actions: MediaCallAppActionDescriptor[];
	handleInteraction: AppButtonInteractionHandler;
};

const MediaCallAppActionsProvider = ({ children, actions, handleInteraction }: MediaCallAppActionsProviderProps) => {
	const value = useMemo<MediaCallAppActionsContextValue>(
		() => ({
			actions: actions.map((action) => ({
				key: brandMediaCallAppAction(action.appId, action.actionId),
				disabled: false,
				...action,
			})),
			handleInteraction,
		}),
		[actions, handleInteraction],
	);

	return <MediaCallAppActionsContext.Provider value={value}>{children}</MediaCallAppActionsContext.Provider>;
};

export default MediaCallAppActionsProvider;
