import { styled, View } from '@tamagui/web';

import { strokeColors, surfaceColors } from '../../../Theme';
import { toCSSValue } from '../../../helpers/toCSSValue';
import { borderRadius, borderWidth, spacing } from '../../../styleTokens';
import { ButtonGroup, type ButtonGroupProps } from '../../ButtonGroup';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { boxText } from '../messageStyles';

const MessageToolbarFrame = styled(View, {
	render: 'div',
	...boxText,
	display: 'inline-block',
	flexShrink: 1,
	marginInline: spacing('x20'),
	padding: spacing('x2'),
	borderWidth: borderWidth('default'),
	borderStyle: 'solid',
	borderColor: String(strokeColors['stroke-extra-light']),
	borderRadius: toCSSValue('--rcx-message-toolbar-border-radius', toCSSValue('--rcx-border-radius-medium', borderRadius('medium'))),
	backgroundColor: String(surfaceColors['surface-room']),
	// Placed and revealed by its message and its wrapper in `Messages.styles.css`
	opacity: 0,
});

export type MessageToolbarProps = ButtonGroupProps;

function MessageToolbar(props: MessageToolbarProps) {
	return (
		<MessageToolbarFrame className='rcx-message-toolbar'>
			<ButtonGroup role='toolbar' small {...props} />
		</MessageToolbarFrame>
	);
}

export default withFuselageProvider(MessageToolbar);
