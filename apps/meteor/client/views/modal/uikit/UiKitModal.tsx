import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { UiKitContext } from '@rocket.chat/fuselage-ui-kit';
import { MarkupInteractionContext } from '@rocket.chat/gazzodown';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { FormEvent } from 'react';

import ModalBlock from './ModalBlock';
import { useModalContextValue } from './useModalContextValue';
import { useUiKitActionManager } from '../../../hooks/uikit/useUiKitActionManager';
import { useUiKitView } from '../../../hooks/uikit/useUiKitView';
import { useOpenedRoom } from '../../../lib/RoomManager';
import { detectEmoji } from '../../../lib/utils/detectEmoji';
import { preventSyntheticEvent } from '../../../lib/utils/preventSyntheticEvent';

export type UiKitModalProps = {
	key: UiKit.ModalView['id']; // force re-mount when viewId changes
	initialView: UiKit.ModalView;
};

const UiKitModal = ({ initialView }: UiKitModalProps) => {
	const actionManager = useUiKitActionManager();
	const { view, errors, values, updateValues, state } = useUiKitView(initialView);
	// The room on screen, for the elements that default to the current conversation.
	const rid = useOpenedRoom();
	const contextValue = useModalContextValue({ view, errors, values, updateValues, rid });
	const useEmoji = useUserPreference<boolean>('useEmojis', true);
	const convertAsciiToEmoji = useUserPreference<boolean>('convertAsciiEmoji', true);

	const handleSubmit = useStableCallback((e: FormEvent) => {
		preventSyntheticEvent(e);
		void actionManager.emitInteraction(view.appId, {
			type: 'viewSubmit',
			payload: {
				view: {
					...view,
					state,
				},
			},
			viewId: view.id,
		});
	});

	const handleCancel = useStableCallback((e: FormEvent) => {
		preventSyntheticEvent(e);
		void actionManager.emitInteraction(view.appId, {
			type: 'viewClosed',
			payload: {
				viewId: view.id,
				view: {
					...view,
					state,
				},
				isCleared: false,
			},
		});
	});

	const handleClose = useStableCallback(() => {
		void actionManager.emitInteraction(view.appId, {
			type: 'viewClosed',
			payload: {
				viewId: view.id,
				view: {
					...view,
					state,
				},
				isCleared: true,
			},
		});
	});

	return (
		<UiKitContext.Provider value={contextValue}>
			<MarkupInteractionContext.Provider
				value={{
					detectEmoji,
					useEmoji,
					convertAsciiToEmoji,
				}}
			>
				<ModalBlock view={view} errors={errors} appId={view.appId} onSubmit={handleSubmit} onCancel={handleCancel} onClose={handleClose} />
			</MarkupInteractionContext.Provider>
		</UiKitContext.Provider>
	);
};

export default UiKitModal;
