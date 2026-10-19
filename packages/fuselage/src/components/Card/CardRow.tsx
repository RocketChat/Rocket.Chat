import type { GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, ReactNode } from 'react';

import { CardBlock } from './CardFrames';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type CardRowProps = {
	children: ReactNode;
} & AllHTMLAttributes<HTMLElement>;

const CardRow = ({ children, ...props }: CardRowProps) => (
	<CardBlock row flexGrow={1} className='rcx-card__row' {...(props as GetProps<typeof CardBlock>)}>
		{children}
	</CardBlock>
);

export default withFuselageProvider(CardRow);
