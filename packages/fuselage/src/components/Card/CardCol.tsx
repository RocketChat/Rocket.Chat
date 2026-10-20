import type { GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, ReactNode } from 'react';

import { CardColFrame } from './CardFrames';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type CardColProps = {
	children: ReactNode;
} & AllHTMLAttributes<HTMLElement>;

const CardCol = ({ children, ...props }: CardColProps) => (
	<CardColFrame className='rcx-card__col' {...(props as GetProps<typeof CardColFrame>)}>
		{children}
	</CardColFrame>
);

export default withFuselageProvider(CardCol);
