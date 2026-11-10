import type { AllHTMLAttributes, ReactNode } from 'react';

import { Box } from '../Box';
import { LabelInfo } from '../Label/LabelInfo';

export type CardTitleProps = {
	children: ReactNode;
	info?: string;
	variant?: 'h3' | 'h4' | 'h5';
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'>;

const CardTitle = ({ children, info, variant = 'h4', ...props }: CardTitleProps) => (
	<Box fontScale={variant} is={variant} rcx-card__title {...props}>
		{children}
		{info && <LabelInfo title={info} />}
	</Box>
);

export default CardTitle;
