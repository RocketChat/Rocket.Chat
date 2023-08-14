import type { IRoom } from '@rocket.chat/core-typings';
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
import React, { memo, useState, useEffect } from 'react';

import { getURL } from '../../../../../app/utils/client';
import { ContextualbarClose, ContextualbarScrollableContent } from '../../../../components/Contextualbar';
import { useUiKitActionManager } from '../../../../hooks/useUiKitActionManager';
import { useContextualBarContextValue } from '../../../../uikit/hooks/useContextualBarContextValue';
import type { ActionManagerState } from '../../../modal/uikit/UiKitModal';
import { getButtonStyle } from '../../../modal/uikit/getButtonStyle';
import { useValues } from '../../../modal/uikit/hooks/useValues';
import { useRoomToolbox } from '../../contexts/RoomToolboxContext';

type UiKitContextualBarProps = ActionManagerState & { roomId: IRoom['_id'] };

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
	const [state, setState] = useState(props);

	const { appId, viewId, view } = state;

	const [values, updateValues] = useValues(view.blocks as Block[]);
	const contextValue = useContextualBarContextValue({ values, updateValues, ...state });

	useEffect(() => {
		const handleUpdate = ({ type, errors, ...data }: UiKitContextualBarProps) => {
			if (type === 'errors') {
				setState((state) => ({ ...state, errors, type }));
				return;
			}

			setState({ ...data, type, errors });
		};

		actionManager.on(viewId, handleUpdate);

		return (): void => {
			actionManager.off(viewId, handleUpdate);
		};
	}, [actionManager, state, viewId]);

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
