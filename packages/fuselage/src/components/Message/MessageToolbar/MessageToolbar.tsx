import { ButtonGroup, type ButtonGroupProps } from '../../ButtonGroup';

export type MessageToolbarProps = ButtonGroupProps;

/**
 * The actions on a message, such as replying in a thread, reacting and the menu, as a row of `MessageToolbarItem`s.
 * Place it in a `MessageToolbarWrapper`.
 */
function MessageToolbar(props: MessageToolbarProps) {
	return (
		<div className='rcx-message-toolbar'>
			<ButtonGroup role='toolbar' small {...props} />
		</div>
	);
}

export default MessageToolbar;
