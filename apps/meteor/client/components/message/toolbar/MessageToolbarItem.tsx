import { MessageToolbarItem as FuselageMessageToolbarItem } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import { useLayoutHiddenActions } from '@rocket.chat/ui-contexts';
import type { MouseEventHandler } from 'react';

type MessageToolbarItemProps = {
	id: string;
	icon: IconName;
	title: string;
	disabled?: boolean;
	danger?: boolean;
	qa: string;
	onClick: MouseEventHandler;
};

const MessageToolbarItem = ({ id, icon, title, disabled, danger, qa, onClick }: MessageToolbarItemProps) => {
	const hiddenActions = useLayoutHiddenActions().messageToolbox;

	if (hiddenActions.includes(id)) {
		return null;
	}

	return (
		<FuselageMessageToolbarItem
			icon={icon}
			title={title}
			disabled={disabled}
			danger={danger}
			data-qa-id={qa}
			data-qa-type='message-action-menu'
			onClick={onClick}
		/>
	);
};

export default MessageToolbarItem;
