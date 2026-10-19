import { styled, Text, type GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, ReactNode } from 'react';

import { textIconColors } from '../../Theme';
import { fontScale, spacing } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type StatesTitleProps = {
	children?: ReactNode;
} & AllHTMLAttributes<HTMLHeadingElement>;

const StatesTitleFrame = styled(Text, {
	render: 'h3',
	display: 'block',
	whiteSpace: 'normal',
	wordWrap: 'normal',
	boxSizing: 'content-box',
	marginBlockStart: 0,
	marginBlockEnd: spacing('x8'),
	textAlign: 'center',
	color: String(textIconColors['font-default']),
	...(fontScale('h3') as object),
});

const StatesTitle = ({ children, ...props }: StatesTitleProps) => (
	<StatesTitleFrame {...(props as GetProps<typeof StatesTitleFrame>)} className='rcx-states__title'>
		{children}
	</StatesTitleFrame>
);

export default withFuselageProvider(StatesTitle);
