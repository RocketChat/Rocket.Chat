import { styled, View, type GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, ReactNode } from 'react';

import { textIconColors } from '../../Theme';
import { spacing } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type StatesProps = {
	children?: ReactNode;
} & AllHTMLAttributes<HTMLDivElement>;

const StatesFrame = styled(View, {
	justifyContent: 'center',
	alignItems: 'center',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
	boxSizing: 'content-box',
	padding: spacing('x16'),
	color: String(textIconColors['font-secondary-info']),
});

const States = ({ children, ...props }: StatesProps) => (
	<StatesFrame {...(props as GetProps<typeof StatesFrame>)} className='rcx-states'>
		{children}
	</StatesFrame>
);

export default withFuselageProvider(States);
