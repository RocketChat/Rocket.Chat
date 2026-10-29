import { styled, View } from '@tamagui/web';
import type { HTMLAttributes, RefAttributes } from 'react';

export type ButtonGroupProps = RefAttributes<HTMLDivElement> & {
	align?: 'start' | 'center' | 'end';
	/** `equal` also gives every button the same width. */
	stretch?: boolean | 'equal';
	wrap?: boolean;
	vertical?: boolean;
	small?: boolean;
	large?: boolean;
} & HTMLAttributes<HTMLDivElement>;

// Declared where they render: zero-runtime only erases a `styled()` whose every use is in its own module
const ButtonGroupFrame = styled(View, {
	render: 'div',
	display: 'flex',
	flexDirection: 'row',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
	flexWrap: 'nowrap',
	justifyContent: 'flex-start',
	alignItems: 'center',
	gap: '0.5rem',
	variants: {
		spacing: {
			small: { gap: '0.25rem' },
			large: { gap: '1rem' },
			medium: {},
		},
		// Direction, wrap and stretch set overlapping flex properties, so each combination is one variant
		flow: {
			'row-nowrap-start': {},
			'row-nowrap-stretch': { alignItems: 'stretch', flexGrow: 1 },
			'row-wrap-start': { flexWrap: 'wrap' },
			'row-wrap-stretch': { flexWrap: 'wrap', alignItems: 'stretch', flexGrow: 1 },
			'column-nowrap-start': { flexDirection: 'column' },
			'column-nowrap-stretch': { flexDirection: 'column', alignItems: 'stretch', flexGrow: 1 },
			'column-wrap-start': { flexDirection: 'column', flexWrap: 'wrap' },
			'column-wrap-stretch': { flexDirection: 'column', flexWrap: 'wrap', alignItems: 'stretch', flexGrow: 1 },
		},
		justify: {
			start: { justifyContent: 'flex-start' },
			center: { justifyContent: 'center' },
			end: { justifyContent: 'flex-end' },
		},
	},
});

/**
 * A container for grouping buttons that semantically share a common action context.
 */
function ButtonGroup({ align = 'start', children, stretch, vertical, wrap, small, large, className, ref, ...props }: ButtonGroupProps) {
	const classes = [
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
		.join(' ');

	const spacing = [small && 'small', large && 'large'].find(Boolean) || 'medium';
	const flow = `${vertical ? 'column' : 'row'}-${wrap ? 'wrap' : 'nowrap'}-${stretch ? 'stretch' : 'start'}`;
	// The caller's attributes go on the element `render` names: zero-runtime rejects spreads on a frame
	const attributes = { role: 'group', ...props };

	return (
		<ButtonGroupFrame render={<div {...attributes} ref={ref} />} spacing={spacing} flow={flow} justify={align} className={classes}>
			{children}
		</ButtonGroupFrame>
	);
}

export default ButtonGroup;
