import type { GetProps } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { CardBlock } from './CardFrames';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type CardControlsProps = HTMLAttributes<HTMLDivElement>;

const CardControls = ({ ...props }: CardControlsProps) => (
	<CardBlock row className='rcx-card__controls' {...(props as GetProps<typeof CardBlock>)} />
);

export default withFuselageProvider(CardControls);
