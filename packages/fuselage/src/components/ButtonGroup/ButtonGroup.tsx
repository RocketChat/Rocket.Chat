import { styled, View } from '@tamagui/web';
import type { HTMLAttributes, RefAttributes } from 'react';

import { asPublicFrame } from '../../helpers/asPublicFrame';
import { variantClass } from '../../helpers/variantClass';
import { spacing } from '../../styleTokens';

/**
 * A container for grouping buttons that semantically share a common action context.
 */
export const ButtonGroupFrame = styled(View, {
	displayName: 'ButtonGroup',
	render: 'div',
	role: 'group',
	display: 'flex',
	flexDirection: 'row',
	flexWrap: 'nowrap',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
	justifyContent: 'flex-start',
	alignItems: 'center',
	gap: spacing('x8'),

	// Every `rcx-button-group*` class comes from a variant, so a consumer's `className` adds to them
	variants: {
		rcx: {
			true: variantClass('rcx-button-group'),
		},
		stretch: {
			true: variantClass('rcx-button-group--stretch', { alignItems: 'stretch', flexGrow: 1 }),
			equal: variantClass('rcx-button-group--stretch rcx-button-group--stretch-equal', { alignItems: 'stretch', flexGrow: 1 }),
		},
		vertical: {
			true: variantClass('rcx-button-group--vertical', { flexDirection: 'column' }),
		},
		align: {
			start: variantClass('rcx-button-group--align-start', { justifyContent: 'flex-start' }),
			center: variantClass('rcx-button-group--align-center', { justifyContent: 'center' }),
			end: variantClass('rcx-button-group--align-end', { justifyContent: 'flex-end' }),
		},
		small: {
			true: variantClass('rcx-button-group--small', { gap: spacing('x4') }),
		},
		large: {
			true: variantClass('rcx-button-group--large', { gap: spacing('x16') }),
		},
		wrap: {
			true: variantClass('rcx-button-group--wrap', { flexWrap: 'wrap' }),
		},
	} as const,

	defaultVariants: {
		rcx: true,
		align: 'start',
	},
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

export default asPublicFrame<ButtonGroupProps>(ButtonGroupFrame);
