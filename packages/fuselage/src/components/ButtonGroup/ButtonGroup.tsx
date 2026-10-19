import { styled, View, type GetProps } from '@tamagui/web';
import type { HTMLAttributes, RefAttributes } from 'react';

import { spacing } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const ButtonGroupFrame = styled(View, {
	render: 'div',
	display: 'flex',
	flexDirection: 'row',
	flexWrap: 'nowrap',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
	justifyContent: 'flex-start',
	alignItems: 'center',
	gap: spacing('x8'),

	variants: {
		gapSize: {
			small: { gap: spacing('x4') },
			large: { gap: spacing('x16') },
		},
		wrap: {
			true: { flexWrap: 'wrap' },
		},
		stretch: {
			true: { alignItems: 'stretch', flexGrow: 1 },
		},
		vertical: {
			true: { flexDirection: 'column' },
		},
		align: {
			start: { justifyContent: 'flex-start' },
			center: { justifyContent: 'center' },
			end: { justifyContent: 'flex-end' },
		},
	} as const,
});

export type ButtonGroupProps = RefAttributes<HTMLDivElement> & {
	align?: 'start' | 'center' | 'end';
	/** `equal` also gives every button the same width. */
	stretch?: boolean | 'equal';
	wrap?: boolean;
	vertical?: boolean;
	small?: boolean;
	large?: boolean;
} & HTMLAttributes<HTMLDivElement>;

/**
 * A container for grouping buttons that semantically share a common action context.
 */
function ButtonGroup({ align = 'start', children, stretch, vertical, wrap, small, large, className, ...props }: ButtonGroupProps) {
	return (
		<ButtonGroupFrame
			className={[
				'rcx-button-group',
				stretch && 'rcx-button-group--stretch',
				stretch === 'equal' && 'rcx-button-group--stretch-equal',
				vertical && 'rcx-button-group--vertical',
				align && `rcx-button-group--align-${align}`,
				small && 'rcx-button-group--small',
				large && 'rcx-button-group--large',
				wrap && 'rcx-button-group--wrap',
				className,
			]
				.filter(Boolean)
				.join(' ')}
			gapSize={(large && 'large') || (small && 'small') || undefined}
			wrap={wrap}
			stretch={stretch}
			vertical={vertical}
			align={align}
			role='group'
			{...(props as GetProps<typeof ButtonGroupFrame>)}
		>
			{children}
		</ButtonGroupFrame>
	);
}

export default withFuselageProvider(ButtonGroup);
