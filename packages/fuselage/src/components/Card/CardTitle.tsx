import type { GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, ReactNode } from 'react';

import { CardText } from './CardFrames';
import { cx } from '../../helpers/composeClassNames';
import { fontScale } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';
import { LabelInfo } from '../Label/LabelInfo';

export type CardTitleProps = {
	children: ReactNode;
	info?: string;
	variant?: 'h3' | 'h4' | 'h5';
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'>;

const CardTitle = ({ children, info, variant = 'h4', className, ...props }: CardTitleProps) => (
	<CardText
		alignItems='center'
		{...fontScale(variant)}
		{...(props as GetProps<typeof CardText>)}
		render={variant}
		className={cx('rcx-card__title', className)}
	>
		{children}
		{info && <LabelInfo title={info} />}
	</CardText>
);

export default withFuselageProvider(CardTitle);
