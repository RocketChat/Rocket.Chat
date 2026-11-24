import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { UiKitContext, useUiKitViewState } from '@rocket.chat/fuselage-ui-kit';
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
	const { view, errors } = useUiKitView(initialView);
	// The room on screen, for the elements that default to the current conversation.
	const rid = useOpenedRoom();
	const viewState = useUiKitViewState(view.blocks, rid);
	const contextValue = useModalContextValue({ view, viewState, errors, rid });
	const useEmoji = useUserPreference<boolean>('useEmojis', true);
	const convertAsciiToEmoji = useUserPreference<boolean>('convertAsciiEmoji', true);

	const handleSubmit = useStableCallback((e: FormEvent) => {
		preventSyntheticEvent(e);
		if (view.submit_disabled || viewState.isUploading()) {
			return;
		}
		void actionManager.emitInteraction(view.appId, {
			type: 'viewSubmit',
			payload: {
				view: {
					...view,
					state: viewState.getState(),
				},
			},
			viewId: view.id,
		});
	});

	// Returns whether the app is to be told about the close.
	const beforeClosing = () => {
		if (view.clearOnClose) {
			actionManager.clearModals(view.appId);
		}

		if (view.notifyOnClose === false) {
			actionManager.disposeView(view.id);
			return false;
		}

		return true;
	};

	const handleCancel = useStableCallback((e: FormEvent) => {
		preventSyntheticEvent(e);
		if (!beforeClosing()) {
			return;
		}
		void actionManager.emitInteraction(view.appId, {
			type: 'viewClosed',
			payload: {
				viewId: view.id,
				view: {
					...view,
					state: viewState.getState(),
				},
				isCleared: false,
			},
		});
	});

	const handleClose = useStableCallback(() => {
		if (!beforeClosing()) {
			return;
		}
		void actionManager.emitInteraction(view.appId, {
			type: 'viewClosed',
			payload: {
				viewId: view.id,
				view: {
					...view,
					state: viewState.getState(),
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
