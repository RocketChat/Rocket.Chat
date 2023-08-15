import type { IUIKitContextualBarInteraction } from '@rocket.chat/apps-engine/definition/uikit';
import { Avatar, Box, Button, ButtonGroup, ContextualbarFooter, ContextualbarHeader, ContextualbarTitle } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import {
	UiKitComponent,
	UiKitContextualBar as UiKitContextualBarSurfaceRender,
	contextualBarParser,
	UiKitContext,
} from '@rocket.chat/fuselage-ui-kit';
import type { LayoutBlock } from '@rocket.chat/ui-kit';
import { BlockContext, type Block } from '@rocket.chat/ui-kit';
import type { ReactEventHandler } from 'react';
import React, { memo } from 'react';

import { getURL } from '../../../../../app/utils/client';
import { ContextualbarClose, ContextualbarScrollableContent } from '../../../../components/Contextualbar';
import { useUiKitActionManager } from '../../../../hooks/useUiKitActionManager';
import { useContextualBarContextValue } from '../../../../uikit/hooks/useContextualBarContextValue';
import { getButtonStyle } from '../../../modal/uikit/getButtonStyle';
import { useValues } from '../../../modal/uikit/hooks/useValues';
import { useRoomToolbox } from '../../contexts/RoomToolboxContext';

type UiKitContextualBarProps = {
	viewId: string;
	rid: string;
	payload: IUIKitContextualBarInteraction;
	appId: string;
};

const groupStateByBlockId = (obj: { value: unknown; blockId: string }[]) =>
	Object.entries(obj).reduce<any>((obj, [key, { blockId, value }]) => {
		obj[blockId] = obj[blockId] || {};
		obj[blockId][key] = value;
		return obj;
	}, {});

const prevent: ReactEventHandler = (e) => {
	if (e) {
		(e.nativeEvent || e).stopImmediatePropagation();
		e.stopPropagation();
		e.preventDefault();
	}
};

const UiKitContextualBar = (props: UiKitContextualBarProps) => {
	const { closeTab } = useRoomToolbox();
	const actionManager = useUiKitActionManager();

	const { appId, payload, viewId } = props;
	const { view } = payload;

	const [values, updateValues] = useValues(view.blocks as Block[]);
	const contextValue = useContextualBarContextValue({ values, updateValues, ...props });

	const handleSubmit = useMutableCallback((e) => {
		prevent(e);
		closeTab();
		actionManager.triggerSubmitView({
			appId,
			viewId,
			payload: {
				view: {
					...view,
					id: viewId,
					state: groupStateByBlockId(values),
				},
			},
		});
	});

	const handleCancel = useMutableCallback((e) => {
		prevent(e);
		closeTab();
		return actionManager.triggerCancel({
			appId,
			viewId,
			view: {
				...view,
				id: viewId,
				state: groupStateByBlockId(values),
			},
		});
	});

	const handleClose = useMutableCallback((e) => {
		prevent(e);
		closeTab();
		return actionManager.triggerCancel({
			appId,
			viewId,
			view: {
				...view,
				id: viewId,
				state: groupStateByBlockId(values),
			},
			isCleared: true,
		});
	});

	return (
		<UiKitContext.Provider value={contextValue}>
			<ContextualbarHeader>
				<Avatar url={getURL(`/api/apps/${appId}/icon`)} />
				<ContextualbarTitle>{contextualBarParser.text(view.title, BlockContext.NONE, 0)}</ContextualbarTitle>
				{handleClose && <ContextualbarClose onClick={handleClose} />}
			</ContextualbarHeader>
			<ContextualbarScrollableContent>
				<Box is='form' method='post' action='#' onSubmit={handleSubmit}>
					<UiKitComponent render={UiKitContextualBarSurfaceRender} blocks={view.blocks as LayoutBlock[]} />
				</Box>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup align='end'>
					{view.close && (
						<Button danger={view.close.style === 'danger'} onClick={handleCancel}>
							{contextualBarParser.text(view.close.text, BlockContext.NONE, 0)}
						</Button>
					)}
					{view.submit && (
						<Button {...getButtonStyle(view)} onClick={handleSubmit}>
							{contextualBarParser.text(view.submit.text, BlockContext.NONE, 1)}
						</Button>
					)}
				</ButtonGroup>
			</ContextualbarFooter>
		</UiKitContext.Provider>
	);
};

export default memo(UiKitContextualBar);
