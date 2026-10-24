import { styled, View, type GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, ReactNode } from 'react';

import { appendClassName } from '../../helpers/appendClassName';
import { cx } from '../../helpers/composeClassNames';
import { patchChildren } from '../../helpers/patchChildren';
import { fontFamily, spacing } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const CardGroupFrame = styled(View, {
	flexDirection: 'row',
	flexWrap: 'nowrap',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
	outlineStyle: 'none',
	fontFamily: fontFamily('sans'),
	fontVariantNumeric: 'tabular-nums',
	justifyContent: 'flex-start',
	alignItems: 'center',

	variants: {
		wrap: {
			true: {
				flexWrap: 'wrap',
				marginBlockEnd: spacing('neg-x16'),
			},
		},
		stretch: {
			true: {
				alignItems: 'stretch',
			},
		},
		vertical: {
			true: {
				flexDirection: 'column',
			},
		},
		align: {
			start: { justifyContent: 'flex-start' },
			center: { justifyContent: 'center' },
			end: { justifyContent: 'flex-end' },
		},
	} as const,
});

export type CardGroupProps = {
	align?: 'start' | 'center' | 'end';
	stretch?: boolean;
	wrap?: boolean;
	vertical?: boolean;
	small?: boolean;
	large?: boolean;
	children?: ReactNode;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is' | 'wrap'>;

const CardGroup = ({ align = 'start', children, stretch, vertical, wrap, className, ...props }: CardGroupProps) => {
	return (
		<CardGroupFrame
			wrap={wrap}
			stretch={stretch}
			vertical={vertical}
			align={align}
			role='group'
			{...(props as GetProps<typeof CardGroupFrame>)}
			className={cx(
				'rcx-card-group',
				`rcx-card-group--align-${align}`,
				stretch && 'rcx-card-group--stretch',
				vertical && 'rcx-card-group--vertical',
				wrap && 'rcx-card-group--wrap',
				className,
			)}
		>
			{patchChildren(children, (childProps: { className: string | string[] }) => ({
				className: appendClassName(childProps.className, 'rcx-card-group__item'),
			}))}
		</CardGroupFrame>
	);
};

export default withFuselageProvider(CardGroup);
