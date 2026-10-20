import type { GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, ReactNode } from 'react';

import { CardText } from './CardFrames';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';
import { LabelInfo } from '../Label/LabelInfo';

export type CardTitleProps = {
	children: ReactNode;
	info?: string;
	variant?: 'h3' | 'h4' | 'h5';
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'>;

const CardTitle = ({ children, info, variant = 'h4', ...props }: CardTitleProps) => {
	const titleProps = useTamaguiBoxProps({ 'fontScale': variant, 'is': variant, 'rcx-card__title': true, ...props });

	return (
		<CardText alignItems='center' {...(titleProps as GetProps<typeof CardText>)}>
			{children}
			{info && <LabelInfo title={info} />}
		</CardText>
	);
};

export default withFuselageProvider(CardTitle, { takesBoxTransforms: true });
