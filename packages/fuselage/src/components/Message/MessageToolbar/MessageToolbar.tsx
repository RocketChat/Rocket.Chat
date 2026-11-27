import { styled, View } from '@tamagui/web';

import { ButtonGroup, type ButtonGroupProps } from '../../ButtonGroup';

export type MessageToolbarProps = ButtonGroupProps;

const ToolbarFrame = styled(View, {});

function MessageToolbar(props: MessageToolbarProps) {
	return (
		<ToolbarFrame className='rcx-message-toolbar' render={<div />}>
			<ButtonGroup role='toolbar' small {...props} />
		</ToolbarFrame>
	);
}

export default MessageToolbar;
