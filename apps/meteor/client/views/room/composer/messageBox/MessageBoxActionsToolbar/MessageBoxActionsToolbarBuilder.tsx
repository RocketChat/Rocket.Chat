import type { IRoom, IMessage } from '@rocket.chat/core-typings';
import { MessageComposerAction } from '@rocket.chat/ui-composer';
import type { ComponentProps } from 'react';
import React, { memo } from 'react';

import ActionsToolbarDropdown from './ActionsToolbarDropdown';
import type { ToolbarAction } from './hooks/ToolbarAction';

type MessageBoxActionsToolbarProps = {
	actions: { featured: ToolbarAction[]; menu: Array<ToolbarAction | string> };
	isRecording: boolean;
	rid: IRoom['_id'];
	tmid?: IMessage['_id'];
};

const MessageBoxActionsToolbarBuilder = ({ actions, isRecording, rid, tmid }: MessageBoxActionsToolbarProps) => {
	const { featured, menu } = actions;
	return (
		<>
			{featured.map((action) => (
				<MessageComposerAction
					key={action.id}
					{...action}
					data-qa-id={action.id}
					icon={action.icon as ComponentProps<typeof MessageComposerAction>['icon']}
				/>
			))}
			{menu.length > 0 && <ActionsToolbarDropdown actions={menu} isRecording={isRecording} rid={rid} tmid={tmid} />}
		</>
	);
};

export default memo(MessageBoxActionsToolbarBuilder);
