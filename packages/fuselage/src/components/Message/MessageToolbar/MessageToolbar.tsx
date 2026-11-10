import { ButtonGroup, type ButtonGroupProps } from '../../ButtonGroup';

export type MessageToolbarProps = ButtonGroupProps;

function MessageToolbar(props: MessageToolbarProps) {
	return (
		<div className='rcx-box rcx-box--full rcx-message-toolbar'>
			<ButtonGroup role='toolbar' small {...props} />
		</div>
	);
}

export default MessageToolbar;
