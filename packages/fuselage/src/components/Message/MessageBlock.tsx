import { styled, View, type GetProps } from '@tamagui/web';
import type { RefAttributes } from 'react';

import { boxText } from './messageStyles';
import { toCSSValue } from '../../helpers/toCSSValue';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import { spacing } from '../../styleTokens';
import type { BoxProps } from '../Box';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const MessageBlockFrame = styled(View, {
	render: 'div',
	...boxText,
	flexShrink: 1,
	marginBlock: spacing('x2'),

	variants: {
		fixedWidth: {
			true: {
				flexGrow: 0,
				maxWidth: toCSSValue('--rcx-message-block-width-fixed', '368px'),
			},
		},
	} as const,
});

export type MessageBlockProps = Omit<BoxProps, 'ref'> &
	RefAttributes<HTMLDivElement> & {
		fixedWidth?: boolean;
	};

function MessageBlock({ className: _className, fixedWidth, ...props }: MessageBlockProps) {
	const frameProps = useTamaguiBoxProps(
		props,
		['rcx-message-block', fixedWidth && 'rcx-message-block--width-fixed'].filter(Boolean).join(' '),
	);

	return <MessageBlockFrame fixedWidth={fixedWidth} {...(frameProps as GetProps<typeof MessageBlockFrame>)} />;
}

export default withFuselageProvider(MessageBlock);
