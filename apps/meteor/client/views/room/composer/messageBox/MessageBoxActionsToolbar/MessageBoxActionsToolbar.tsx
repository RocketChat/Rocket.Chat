import type { IRoom, IMessage } from '@rocket.chat/core-typings';
import { MessageComposerAction, MessageComposerActionsDivider } from '@rocket.chat/ui-composer';
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

	const { featured, menu } = data;

	if (!featured.length && !menu.length) {
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
			{menu.length > 0 && <ActionsToolbarDropdown actions={menu} isRecording={isRecording} rid={rid} tmid={tmid} />}
		</>
	);
};

export default memo(MessageBoxActionsToolbarBuilder);
