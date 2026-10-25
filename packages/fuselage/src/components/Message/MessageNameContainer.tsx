import { styled, Text, type GetProps } from '@tamagui/web';
import type { HTMLAttributes, RefAttributes } from 'react';

import { boxText, focusState, truncatedText } from './messageStyles';
import { textIconColors } from '../../Theme';
import { spacing } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const MessageNameContainerFrame = styled(Text, {
	render: 'span',
	...boxText,
	...truncatedText,
	...focusState,
	flexShrink: 0,
	marginInline: spacing('x2'),
	// Must match `MessageName`'s color, or the hover underline mismatches the text under it.
	color: String(textIconColors['font-titles-labels']),

	variants: {
		button: {
			true: {
				cursor: 'pointer',
				textDecorationLine: { hover: 'underline' },
			},
		},
	} as const,
});

export type MessageNameContainerProps = HTMLAttributes<HTMLSpanElement> & RefAttributes<HTMLSpanElement>;

function MessageNameContainer(props: MessageNameContainerProps) {
	return (
		<MessageNameContainerFrame
			button={props.role === 'button'}
			className='rcx-message-header__name-container'
			{...(props as GetProps<typeof MessageNameContainerFrame>)}
		/>
	);
}

export default withFuselageProvider(MessageNameContainer);
