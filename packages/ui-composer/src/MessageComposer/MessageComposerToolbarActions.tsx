import { useToolbar } from '@react-aria/toolbar';
import type { ButtonGroupProps } from '@rocket.chat/fuselage';
import { ButtonGroup } from '@rocket.chat/fuselage';
import { useRef } from 'react';

export type MessageComposerToolbarActionsProps = ButtonGroupProps;

const MessageComposerToolbarActions = (props: MessageComposerToolbarActionsProps) => {
	const ref = useRef(null);
	const { toolbarProps } = useToolbar(props, ref);

	return (
		<ButtonGroup role='toolbar' small ref={ref} {...toolbarProps}>
			{props.children}
		</ButtonGroup>
	);
};

export default MessageComposerToolbarActions;
