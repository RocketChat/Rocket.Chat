import type { IRoom, IMessage } from '@rocket.chat/core-typings';
import { MessageComposerAction, MessageComposerActionsDivider } from '@rocket.chat/ui-composer';
import { useLayoutHiddenActions } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import React, { memo } from 'react';

import ActionsToolbarDropdown from './ActionsToolbarDropdown';
import { useToolbarActions } from './hooks/useToolbarActions';

type MessageBoxActionsToolbarProps = {
	canSend: boolean;
	typing: boolean;
	isMicrophoneDenied: boolean;
	variant: 'small' | 'large';
	isRecording: boolean;
	rid: IRoom['_id'];
	tmid?: IMessage['_id'];
};

const MessageBoxActionsToolbarBuilder = ({
	canSend,
	typing,
	isRecording,
	rid,
	tmid,
	variant = 'large',
	isMicrophoneDenied,
}: MessageBoxActionsToolbarProps) => {
	const data = useToolbarActions({
		canSend,
		typing,
		isRecording,
		isMicrophoneDenied: Boolean(isMicrophoneDenied),
		rid,
		tmid,
		variant,
	});
	const { composerToolbox: hiddenActions } = useLayoutHiddenActions();

	const featured = data.featured.filter((action) => !hiddenActions.includes(action.id));
	const menu = data.menu.filter((action) => {
		if (typeof action === 'string') {
			return action;
		}
		return !hiddenActions.includes(action.id);
	});

	const hasValidMenuItems = menu.some((item) => typeof item !== 'string');

	if (!featured.length && !hasValidMenuItems) {
		return null;
	}

	return (
		<>
			<MessageComposerActionsDivider />
			{featured.map((action) => (
				<MessageComposerAction
					key={action.id}
					{...action}
					data-qa-id={action.id}
					icon={action.icon as ComponentProps<typeof MessageComposerAction>['icon']}
				/>
			))}
			{hasValidMenuItems && <ActionsToolbarDropdown actions={menu} isRecording={isRecording} rid={rid} tmid={tmid} />}
		</>
	);
};

export default memo(MessageBoxActionsToolbarBuilder);
