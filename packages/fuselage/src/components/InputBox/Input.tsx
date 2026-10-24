import { styled, View, type GetProps } from '@tamagui/web';
import { createContext, useContext, type AllHTMLAttributes } from 'react';

import { shadowColors, strokeColors, surfaceColors, textIconColors } from '../../Theme';
import { renderAs } from '../../helpers/renderAs';
import { toCSSValue } from '../../helpers/toCSSValue';
import { borderRadius, borderWidth, fontFamily, fontScale, size, spacing } from '../../styleTokens';
import type { ElementProps } from '../../types/ElementProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const inputColor = (name: string, fallback: unknown) => toCSSValue(`--rcx-input-colors-${name}`, String(fallback));

export const inputTextColor = inputColor('color', textIconColors['font-titles-labels']);

// The frame styles of an input in its resting and pointer states; forced, disabled and invalid states stay in `InputBox.styles.css`
export const inputChrome = {
	borderWidth: borderWidth('default'),
	borderStyle: 'solid',
	borderColor: {
		'default': inputColor('border-color', strokeColors['stroke-light']),
		'hover': inputColor('hover-border-color', strokeColors['stroke-dark']),
		'focus-within': inputColor('focus-border-color', strokeColors['stroke-highlight']),
		'focus': inputColor('focus-border-color', strokeColors['stroke-highlight']),
		'press': inputColor('active-border-color', strokeColors['stroke-dark']),
	},
	borderRadius: toCSSValue('--rcx-input-border-radius', toCSSValue('--rcx-border-radius-medium', borderRadius('medium'))),
	backgroundColor: inputColor('background-color', surfaceColors['surface-light']),
	boxShadow: {
		'default': 'none',
		'focus-within': `0 0 0 ${borderWidth('medium')} ${inputColor('focus-shadow-color', shadowColors['shadow-highlight'])}`,
		'focus': `0 0 0 ${borderWidth('medium')} ${inputColor('focus-shadow-color', shadowColors['shadow-highlight'])}`,
		'press': 'none',
	},
} as const;

const p2m = fontScale('p2m');

const InputFrame = styled(View, {
	render: 'input',
	// Restates what `rcx-box--full` gave the input before it left `Box`
	margin: 0,
	padding: 0,
	borderWidth: 0,
	borderStyle: 'solid',
	borderColor: 'currentColor',
	outlineStyle: 'none',
	outlineWidth: 0,
	fontFamily: fontFamily('sans'),
	fontVariantNumeric: 'tabular-nums',

	position: 'relative',
	display: 'inline-flex',
	flexDirection: 'row',
	flexGrow: 1,
	flexShrink: 0,
	flexBasis: 'auto',
	width: size('none'),
	minWidth: size('x128'),
	minHeight: 'auto',
	verticalAlign: 'baseline',
	whiteSpace: 'nowrap',
	wordBreak: 'break-all',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	backgroundColor: 'transparent',
	letterSpacing: p2m.letterSpacing,
	fontSize: p2m.fontSize,
	fontWeight: p2m.fontWeight as 500,
	lineHeight: p2m.lineHeight,
	color: inputTextColor,
	caretColor: {
		focus: inputColor('focus-caret-color', textIconColors['font-titles-labels']),
		press: inputColor('active-caret-color', textIconColors['font-titles-labels']),
	},

	variants: {
		decorated: {
			true: {
				...inputChrome,
				minWidth: size('x128'),
				minHeight: size('x40'),
				paddingBlock: spacing('x8'),
				paddingInline: `calc(${spacing('x16')} - ${borderWidth('default')})`,
			},
		},
		kind: {
			textarea: {
				overflow: 'auto',
				resize: 'none',
				verticalAlign: 'middle',
				whiteSpace: 'normal',
			},
			select: {
				overflow: 'auto',
				appearance: 'none',
			},
			multipleSelect: {
				overflow: 'auto',
				appearance: 'none',
				verticalAlign: 'middle',
			},
		},
		placeholderVisible: {
			true: {
				color: inputColor('placeholder-color', textIconColors['font-hint']),
			},
		},
		wrapped: {
			true: {
				minWidth: size('none'),
			},
		},
		invisible: {
			true: { visibility: 'hidden', opacity: 0 },
		},
	} as const,
});

export const InputBoxWrapperContext = createContext(false);

export type InputProps<T extends HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> = ElementProps<T, AllHTMLAttributes<T>> & {
	is?: 'input' | 'textarea' | 'select';
	htmlSize?: number;
	invisible?: boolean;
};

// The modifiers `InputBox` passes as `rcx-*` attributes, outside the public props
type InputBoxModifiers = {
	'rcx-input-box--type'?: string;
	'rcx-input-box--multiple'?: boolean;
	'rcx-input-box--placeholder-visible'?: boolean;
	'rcx-input-box--small'?: boolean;
	'rcx-input-box--undecorated'?: boolean;
};

function Input<T extends HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>({
	is = 'input',
	disabled,
	htmlSize,
	invisible,
	className,
	...rest
}: InputProps<T>) {
	const wrapped = useContext(InputBoxWrapperContext);
	const {
		'rcx-input-box--type': type,
		'rcx-input-box--multiple': multiple,
		'rcx-input-box--placeholder-visible': placeholderVisible,
		'rcx-input-box--small': small,
		'rcx-input-box--undecorated': undecorated,
		...props
	} = rest as typeof rest & InputBoxModifiers;
	const kind = (type === 'textarea' && 'textarea') || (type === 'select' && (multiple ? 'multipleSelect' : 'select')) || undefined;

	return (
		<InputFrame
			decorated={!(undecorated || className?.split(/\s+/).includes('rcx-input-box--undecorated'))}
			kind={kind}
			placeholderVisible={!!placeholderVisible}
			wrapped={wrapped}
			invisible={invisible}
			render={is}
			// `InputBox` hands its class names to both the wrapper and this input; `rcx-box--full` keeps the `Margins` ones off the input, as before
			className={[
				'rcx-input-box rcx-box--animated',
				wrapped && 'rcx-box--full',
				type && `rcx-input-box--type-${type}`,
				multiple && 'rcx-input-box--multiple',
				placeholderVisible && 'rcx-input-box--placeholder-visible',
				small && 'rcx-input-box--small',
				undecorated && 'rcx-input-box--undecorated',
				className,
			]
				.filter(Boolean)
				.join(' ')}
			{...(props as GetProps<typeof InputFrame>)}
			// Tamagui takes `size` as a style and adds `aria-disabled` next to `disabled`; rendering both attributes directly keeps the input as it was.
			{...((disabled || htmlSize !== undefined) && { render: renderAs(is, { disabled, size: htmlSize }) })}
		/>
	);
}

export default withFuselageProvider(Input);
