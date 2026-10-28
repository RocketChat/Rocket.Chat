import { styled, type GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, ReactNode } from 'react';

import { CardText } from './CardFrames';
import { cx } from '../../helpers/composeClassNames';
import { fontScale } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';
import { LabelInfo } from '../Label/LabelInfo';

const CardTitleFrame = styled(CardText, {
	alignItems: 'center',

	variants: {
		level: {
			h3: fontScale('h3'),
			h4: fontScale('h4'),
			h5: fontScale('h5'),
		},
	} as const,
});

export type CardTitleProps = {
	children: ReactNode;
	info?: string;
	variant?: 'h3' | 'h4' | 'h5';
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'>;

const CardTitle = ({ children, info, variant = 'h4', className, ...props }: CardTitleProps) => (
	<CardTitleFrame
		level={variant}
		{...(props as GetProps<typeof CardTitleFrame>)}
		render={variant}
		className={cx('rcx-card__title', className)}
	>
		{children}
		{info && <LabelInfo title={info} />}
	</CardTitleFrame>
);

export default withFuselageProvider(CardTitle);
