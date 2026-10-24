import { styled, Text, type GetProps } from '@tamagui/web';
import type { ElementType, LabelHTMLAttributes } from 'react';
import { createContext, useContext } from 'react';

import { renderAs } from '../../helpers/renderAs';
import { fontColor, fontFamily, fontScale, spacing } from '../../styleTokens';
import type { ElementProps } from '../../types/ElementProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

// Restates what `rcx-box--full` gave these elements before they left `Box`
export const labelBoxDefaults = {
	borderWidth: 0,
	borderStyle: 'solid',
	borderColor: 'currentColor',
	outlineStyle: 'none',
	fontFamily: fontFamily('sans'),
	fontVariantNumeric: 'tabular-nums',
	whiteSpace: 'inherit',
	wordWrap: 'inherit',
} as const;

const p2m = fontScale('p2m');

const LabelFrame = styled(Text, {
	render: 'label',
	...labelBoxDefaults,
	fontSize: p2m.fontSize,
	fontWeight: p2m.fontWeight as 500,
	lineHeight: p2m.lineHeight,
	letterSpacing: p2m.letterSpacing,
	display: 'flex',
	cursor: 'default',
	color: fontColor('default'),

	variants: {
		dimmed: {
			true: {
				pointerEvents: 'none',
				color: fontColor('secondary-info'),
			},
		},
		field: {
			true: {
				alignSelf: 'flex-start',
				marginBlock: spacing('x2'),
				marginInlineEnd: spacing('x8'),
			},
		},
	} as const,
});

const LabelRequired = styled(Text, {
	render: 'span',
	...labelBoxDefaults,
	marginInlineStart: spacing('x4'),
	color: fontColor('danger'),
});

const RequiredMark = () => (
	<LabelRequired aria-hidden className='rcx-label__required'>
		*
	</LabelRequired>
);

const LabelContext = createContext(false);

// `FieldLabel` marks its label with this class
const isFieldLabel = (className?: string) => !!className?.split(' ').includes('rcx-field__label');

export type LabelProps = ElementProps<HTMLElement, LabelHTMLAttributes<HTMLElement>> & {
	/** Renders another element, such as a `legend` or a `span`. */
	is?: ElementType;
	disabled?: boolean;
	required?: boolean;
};

/**
 * A caption for an input component.
 */
function Label({ disabled, is, required, className, children, ...props }: LabelProps) {
	const isInsideLabel = useContext(LabelContext);
	const component = is || (isInsideLabel && 'span') || 'label';

	return (
		<LabelContext.Provider value={true}>
			<LabelFrame
				dimmed={disabled}
				field={isFieldLabel(className)}
				render={typeof component === 'string' ? component : renderAs(component)}
				className={['rcx-label', disabled && 'rcx-label--disabled', className].filter(Boolean).join(' ')}
				{...(props as GetProps<typeof LabelFrame>)}
			>
				{children}
				{required && <RequiredMark />}
			</LabelFrame>
		</LabelContext.Provider>
	);
}

export default withFuselageProvider(Label);
