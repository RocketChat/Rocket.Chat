import { useToolbar } from '@react-aria/toolbar';
import { ButtonGroup } from '@rocket.chat/fuselage';
import { useRef, type ComponentProps } from 'react';

export type MessageComposerToolbarActionsProps = ComponentProps<typeof ButtonGroup>;

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
