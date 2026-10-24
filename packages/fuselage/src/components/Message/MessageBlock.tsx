import { styled, View, type GetProps } from '@tamagui/web';

import { boxText } from './messageStyles';
import { cx } from '../../helpers/composeClassNames';
import { toCSSValue } from '../../helpers/toCSSValue';
import { spacing } from '../../styleTokens';
import type { ElementProps } from '../../types/ElementProps';
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
				width: '100%',
				maxWidth: toCSSValue('--rcx-message-block-width-fixed', '368px'),
			},
		},
	} as const,
});

export type MessageBlockProps = ElementProps<HTMLDivElement> & {
	fixedWidth?: boolean;
};

function MessageBlock({ className: _className, fixedWidth, ...props }: MessageBlockProps) {
	return (
		<MessageBlockFrame
			fixedWidth={fixedWidth}
			{...(props as GetProps<typeof MessageBlockFrame>)}
			className={cx('rcx-message-block', fixedWidth && 'rcx-message-block--width-fixed')}
		/>
	);
}

export default withFuselageProvider(MessageBlock);
