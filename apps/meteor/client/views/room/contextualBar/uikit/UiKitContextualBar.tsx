import { Avatar, Box, Button, ButtonGroup, ContextualbarFooter, ContextualbarHeader, ContextualbarTitle } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import {
	UiKitComponent,
	UiKitContextualBar as UiKitContextualBarSurfaceRender,
	contextualBarParser,
	UiKitContext,
} from '@rocket.chat/fuselage-ui-kit';
import type * as UiKit from '@rocket.chat/ui-kit';
import { BlockContext } from '@rocket.chat/ui-kit';
import type { FormEvent, UIEvent } from 'react';
import { memo } from 'react';

import { getURL } from '../../../../../app/utils/client';
import { ContextualbarClose, ContextualbarScrollableContent } from '../../../../components/Contextualbar';
import { preventSyntheticEvent } from '../../../../lib/utils/preventSyntheticEvent';
import { useContextualBarContextValue } from '../../../../uikit/hooks/useContextualBarContextValue';
import { useUiKitActionManager } from '../../../../uikit/hooks/useUiKitActionManager';
import { useUiKitView } from '../../../../uikit/hooks/useUiKitView';
import { getButtonStyle } from '../../../modal/uikit/getButtonStyle';
import { useRoomToolbox } from '../../contexts/RoomToolboxContext';

type UiKitContextualBarProps = {
	key: UiKit.ContextualBarView['id']; // force re-mount when viewId changes
	initialView: UiKit.ContextualBarView;
};

const UiKitContextualBar = ({ initialView }: UiKitContextualBarProps): JSX.Element => {
	const actionManager = useUiKitActionManager();
	const { view, values, updateValues, state } = useUiKitView(initialView);
	const contextValue = useContextualBarContextValue({ view, values, updateValues });

	const { closeTab } = useRoomToolbox();

	const handleSubmit = useEffectEvent((e: FormEvent) => {
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
		});
	});

	const handleCancel = useEffectEvent((e: UIEvent) => {
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
		});
	});

	const handleClose = useEffectEvent((e: UIEvent) => {
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
		});
	});

	return (
		<UiKitContext.Provider value={contextValue}>
			<ContextualbarHeader>
				<Avatar url={getURL(`/api/apps/${view.appId}/icon`)} />
				<ContextualbarTitle>{contextualBarParser.text(view.title, BlockContext.NONE, 0)}</ContextualbarTitle>
				{handleClose && <ContextualbarClose onClick={handleClose} />}
			</ContextualbarHeader>
			<ContextualbarScrollableContent>
				<Box is='form' method='post' action='#' onSubmit={handleSubmit}>
					<UiKitComponent render={UiKitContextualBarSurfaceRender} blocks={view.blocks} />
				</Box>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					{view.close && (
						<Button danger={view.close.style === 'danger'} onClick={handleCancel}>
							{contextualBarParser.text(view.close.text, BlockContext.NONE, 0)}
						</Button>
					)}

					{view.submit && (
						<Button {...getButtonStyle(view.submit)} onClick={handleSubmit}>
							{contextualBarParser.text(view.submit.text, BlockContext.NONE, 1)}
						</Button>
					)}
				</ButtonGroup>
			</ContextualbarFooter>
		</UiKitContext.Provider>
	);
};

export default memo(UiKitContextualBar);
