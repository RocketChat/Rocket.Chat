import type { GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, ReactNode } from 'react';

import { CardBlock } from './CardFrames';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type CardHeaderProps = {
	children: ReactNode;
} & AllHTMLAttributes<HTMLElement>;

const CardHeader = ({ children, ...props }: CardHeaderProps) => (
	<CardBlock row className='rcx-card__header' {...(props as GetProps<typeof CardBlock>)}>
		{children}
	</CardBlock>
);

export default withFuselageProvider(CardHeader);
