import { styled, Text, type GetProps } from '@tamagui/web';
import type { ReactNode, MouseEvent as ReactMouseEvent, AllHTMLAttributes } from 'react';

import { surfaceColors, textIconColors } from '../../../Theme';
import { toCSSValue } from '../../../helpers/toCSSValue';
import { spacing } from '../../../styleTokens';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { boxText, focusState, textScale, truncatedText } from '../messageStyles';

const MessageSystemFrame = styled(Text, {
	render: 'div',
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'flex-start',
	flexShrink: 1,
	...boxText,
	...textScale('c1'),
	...truncatedText,
	marginInline: spacing('x2'),
	paddingBlock: spacing('x8'),
	paddingInline: spacing('x20'),
	color: String(textIconColors['font-default']),
	...focusState,

	variants: {
		selected: {
			true: {
				// `!important` keeps it over app CSS, as the SCSS did
				backgroundColor: `${toCSSValue('--rcx-message-system-background-color-selected', surfaceColors['surface-selected'])} !important`,
			},
		},
	} as const,
});

export type MessageSystemProps = {
	children?: ReactNode;
	title?: string;
	isSelected?: boolean;
	onClick?: (e: ReactMouseEvent<HTMLDivElement, MouseEvent>) => void;
} & AllHTMLAttributes<HTMLDivElement>;

const MessageSystem = ({ children, title, isSelected, ...props }: MessageSystemProps) => (
	<MessageSystemFrame
		selected={isSelected}
		className={['rcx-message-system', isSelected && 'rcx-message-system--selected'].filter(Boolean).join(' ')}
		{...({ title, ...props } as GetProps<typeof MessageSystemFrame>)}
	>
		{children}
	</MessageSystemFrame>
);

export default withFuselageProvider(MessageSystem);
