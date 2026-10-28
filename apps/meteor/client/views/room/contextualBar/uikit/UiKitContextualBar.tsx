import { Avatar, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import {
	UiKitComponent,
	UiKitContextualBar as UiKitContextualBarSurfaceRender,
	contextualBarParser,
	UiKitContext,
} from '@rocket.chat/fuselage-ui-kit';
import {
	ContextualbarHeader,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarDialog,
	ContextualbarScrollableContent,
	ContextualbarFooter,
} from '@rocket.chat/ui-client';
import { useRoomToolbox } from '@rocket.chat/ui-contexts';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { FormEvent, UIEvent } from 'react';
import { memo } from 'react';

import { useContextualBarContextValue } from './useContextualBarContextValue';
import { useUiKitActionManager } from '../../../../hooks/uikit/useUiKitActionManager';
import { useUiKitView } from '../../../../hooks/uikit/useUiKitView';
import { getURL } from '../../../../lib/getURL';
import { preventSyntheticEvent } from '../../../../lib/utils/preventSyntheticEvent';
import { getButtonStyle } from '../../../modal/uikit/getButtonStyle';
import { useRoom } from '../../contexts/RoomContext';

export type UiKitContextualBarProps = {
	key: UiKit.ContextualBarView['id']; // force re-mount when viewId changes
	initialView: UiKit.ContextualBarView;
};

const UiKitContextualBar = ({ initialView }: UiKitContextualBarProps) => {
	const actionManager = useUiKitActionManager();
	const { view, values, updateValues, state } = useUiKitView(initialView);
	const room = useRoom();
	const contextValue = useContextualBarContextValue({ view, values, updateValues, rid: room._id });

	const { closeTab } = useRoomToolbox();

	const handleSubmit = useStableCallback((e: FormEvent) => {
		preventSyntheticEvent(e);
		closeTab();
		void actionManager.emitInteraction(view.appId, {
			type: 'viewSubmit',
			payload: {
				view: {
					...view,
					state,
				},
			},
			viewId: view.id,
			rid: room._id,
		});
	});

	const handleCancel = useStableCallback((e: UIEvent) => {
		preventSyntheticEvent(e);
		closeTab();
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
			rid: room._id,
		});
	});

	const handleClose = useStableCallback((e: UIEvent) => {
		preventSyntheticEvent(e);
		closeTab();
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
			rid: room._id,
		});
	});

	return (
		<UiKitContext.Provider value={contextValue}>
			<ContextualbarDialog>
				<ContextualbarHeader>
					<Avatar url={getURL(`/api/apps/${view.appId}/icon`)} />
					<ContextualbarTitle>{contextualBarParser.renderTextObject(view.title, 0)}</ContextualbarTitle>
					{handleClose && <ContextualbarClose onClick={handleClose} />}
				</ContextualbarHeader>
				<ContextualbarScrollableContent>
					<form method='post' action='#' onSubmit={handleSubmit}>
						<UiKitComponent render={UiKitContextualBarSurfaceRender} blocks={view.blocks} />
					</form>
				</ContextualbarScrollableContent>
				<ContextualbarFooter>
					<ButtonGroup stretch>
						{view.close && (
							<Button variant={view.close.style === 'danger' ? 'danger' : undefined} onClick={handleCancel}>
								{contextualBarParser.renderTextObject(view.close.text, 0)}
							</Button>
						)}

						{view.submit && (
							<Button {...getButtonStyle(view.submit)} onClick={handleSubmit}>
								{contextualBarParser.renderTextObject(view.submit.text, 1)}
							</Button>
						)}
					</ButtonGroup>
				</ContextualbarFooter>
			</ContextualbarDialog>
		</UiKitContext.Provider>
	);
};

export default memo(UiKitContextualBar);
