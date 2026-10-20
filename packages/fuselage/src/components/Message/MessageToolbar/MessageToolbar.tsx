import { styled, View } from '@tamagui/web';

import { MessageToolbarContext } from './MessageToolbarContext';
import { strokeColors, surfaceColors } from '../../../Theme';
import { toCSSValue } from '../../../helpers/toCSSValue';
import { borderRadius, borderWidth, spacing } from '../../../styleTokens';
import { ButtonGroup, type ButtonGroupProps } from '../../ButtonGroup';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { MessageContext } from '../MessageContext';
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
	borderRadius: toCSSValue('--rcx-message-toolbar-border-radius', toCSSValue('--rcx-border-radius-medium', borderRadius('medium')!)),
	backgroundColor: String(surfaceColors['surface-room']),
	opacity: { 'default': 0, 'group-hover/message': 1, 'group-focus-visible/message': 1 },

	variants: {
		inMessage: {
			true: {
				position: 'absolute',
				zIndex: 10,
				top: spacing('neg-x24'),
				insetInlineEnd: 0,
			},
		},
		visible: {
			true: {
				opacity: 1,
			},
		},
	} as const,
});

export type MessageToolbarProps = ButtonGroupProps;

function MessageToolbar(props: MessageToolbarProps) {
	const { inMessage } = MessageContext.useStyledContext();
	const { visible } = MessageToolbarContext.useStyledContext();

	return (
		<MessageToolbarFrame className='rcx-message-toolbar' inMessage={inMessage} visible={visible}>
			<ButtonGroup role='toolbar' small {...props} />
		</MessageToolbarFrame>
	);
}

export default withFuselageProvider(MessageToolbar);
