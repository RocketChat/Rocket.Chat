import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { UiKitContext } from '@rocket.chat/fuselage-ui-kit';
import { MarkupInteractionContext } from '@rocket.chat/gazzodown';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { FormEvent } from 'react';

import ModalBlock from './ModalBlock';
import { detectEmoji } from '../../../lib/utils/detectEmoji';
import { preventSyntheticEvent } from '../../../lib/utils/preventSyntheticEvent';
import { useModalContextValue } from '../../../uikit/hooks/useModalContextValue';
import { useUiKitActionManager } from '../../../uikit/hooks/useUiKitActionManager';
import { useUiKitView } from '../../../uikit/hooks/useUiKitView';

type UiKitModalProps = {
	key: UiKit.ModalView['id']; // force re-mount when viewId changes
	initialView: UiKit.ModalView;
};

const UiKitModal = ({ initialView }: UiKitModalProps) => {
	const actionManager = useUiKitActionManager();
	const { view, errors, values, updateValues, state } = useUiKitView(initialView);
	const contextValue = useModalContextValue({ view, errors, values, updateValues });

	const handleSubmit = useEffectEvent((e: FormEvent) => {
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

	const handleCancel = useEffectEvent((e: FormEvent) => {
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

	const handleClose = useEffectEvent(() => {
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
				}}
			>
				<ModalBlock view={view} errors={errors} appId={view.appId} onSubmit={handleSubmit} onCancel={handleCancel} onClose={handleClose} />
			</MarkupInteractionContext.Provider>
		</UiKitContext.Provider>
	);
};

export default UiKitModal;
