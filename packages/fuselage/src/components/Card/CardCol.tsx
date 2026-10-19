import type { GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, ReactNode } from 'react';

import { CardBlock } from './CardFrames';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type CardColProps = {
	children: ReactNode;
} & AllHTMLAttributes<HTMLElement>;

const CardCol = ({ children, ...props }: CardColProps) => (
	<CardBlock className='rcx-card__col' {...(props as GetProps<typeof CardBlock>)}>
		{children}
	</CardBlock>
);

export default withFuselageProvider(CardCol);
