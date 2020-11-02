declare module '@rocket.chat/fuselage' {
	import { css } from '@rocket.chat/css-in-js';
	import {
		CSSProperties,
		AllHTMLAttributes,
		ElementType,
		ForwardRefExoticComponent,
		PropsWithChildren,
		RefAttributes,
	} from 'react';

	type CssClassName = ReturnType<typeof css>;
	type BoxSimpleClassName = string | CssClassName;
	type BoxClassName = BoxSimpleClassName | BoxSimpleClassName[];
	type FontScale = 'h1' | 's1' | 's2' | 'p1' | 'p2' | 'c1' | 'c2' | 'micro';

	type BoxProps = PropsWithChildren<{
		is?: ElementType;
		className?: BoxClassName;
		style?: CSSProperties;
		border?: CSSProperties['border'];
		borderBlock?: CSSProperties['borderBlock'];
		borderBlockStart?: CSSProperties['borderBlockStart'];
		borderBlockEnd?: CSSProperties['borderBlockEnd'];
		borderInline?: CSSProperties['borderInline'];
		borderInlineStart?: CSSProperties['borderInlineStart'];
		borderInlineEnd?: CSSProperties['borderInlineEnd'];
		borderWidth?: CSSProperties['borderWidth'];
		borderBlockWidth?: CSSProperties['borderBlockWidth'];
		borderBlockStartWidth?: CSSProperties['borderBlockStartWidth'];
		borderBlockEndWidth?: CSSProperties['borderBlockEndWidth'];
		borderInlineWidth?: CSSProperties['borderInlineWidth'];
		borderInlineStartWidth?: CSSProperties['borderInlineStartWidth'];
		borderInlineEndWidth?: CSSProperties['borderInlineEndWidth'];
		borderStyle?: CSSProperties['borderStyle'];
		borderBlockStyle?: CSSProperties['borderBlockStyle'];
		borderBlockStartStyle?: CSSProperties['borderBlockStartStyle'];
		borderBlockEndStyle?: CSSProperties['borderBlockEndStyle'];
		borderInlineStyle?: CSSProperties['borderInlineStyle'];
		borderInlineStartStyle?: CSSProperties['borderInlineStartStyle'];
		borderInlineEndStyle?: CSSProperties['borderInlineEndStyle'];
		borderColor?: CSSProperties['borderColor'];
		borderBlockColor?: CSSProperties['borderBlockColor'];
		borderBlockStartColor?: CSSProperties['borderBlockStartColor'];
		borderBlockEndColor?: CSSProperties['borderBlockEndColor'];
		borderInlineColor?: CSSProperties['borderInlineColor'];
		borderInlineStartColor?: CSSProperties['borderInlineStartColor'];
		borderInlineEndColor?: CSSProperties['borderInlineEndColor'];
		borderRadius?: CSSProperties['borderRadius'];
		borderStartStartRadius?: CSSProperties['borderStartStartRadius'];
		borderStartEndRadius?: CSSProperties['borderStartEndRadius'];
		borderEndStartRadius?: CSSProperties['borderEndStartRadius'];
		borderEndEndRadius?: CSSProperties['borderEndEndRadius'];

		color?: CSSProperties['color'];
		backgroundColor?: CSSProperties['backgroundColor'];
		bg?: CSSProperties['backgroundColor'];
		opacity?: CSSProperties['opacity'];

		alignItems?: CSSProperties['alignItems'];
		alignContent?: CSSProperties['alignContent'];
		justifyItems?: CSSProperties['justifyItems'];
		justifyContent?: CSSProperties['justifyContent'];
		flexWrap?: CSSProperties['flexWrap'];
		flexDirection?: CSSProperties['flexDirection'];
		flexGrow?: CSSProperties['flexGrow'];
		flexShrink?: CSSProperties['flexShrink'];
		flexBasis?: CSSProperties['flexBasis'];
		justifySelf?: CSSProperties['justifySelf'];
		alignSelf?: CSSProperties['alignSelf'];
		order?: CSSProperties['order'];

		w?: CSSProperties['width'];
		width?: CSSProperties['width'];
		minWidth?: CSSProperties['minWidth'];
		maxWidth?: CSSProperties['maxWidth'];
		h?: CSSProperties['height'];
		height?: CSSProperties['height'];
		minHeight?: CSSProperties['minHeight'];
		maxHeight?: CSSProperties['maxHeight'];
		display?: CSSProperties['display'];
		verticalAlign?: CSSProperties['verticalAlign'];
		overflow?: CSSProperties['overflow'];
		overflowX?: CSSProperties['overflowX'];
		overflowY?: CSSProperties['overflowY'];

		position?: CSSProperties['position'];
		zIndex?: CSSProperties['zIndex'];
		inset?: CSSProperties['inset'];
		insetBlock?: CSSProperties['insetBlock'];
		insetBlockStart?: CSSProperties['insetBlockStart'];
		insetBlockEnd?: CSSProperties['insetBlockEnd'];
		insetInline?: CSSProperties['insetInline'];
		insetInlineStart?: CSSProperties['insetInlineStart'];
		insetInlineEnd?: CSSProperties['insetInlineEnd'];

		m?: CSSProperties['margin'];
		margin?: CSSProperties['margin'];
		mb?: CSSProperties['marginBlock'];
		marginBlock?: CSSProperties['marginBlock'];
		mbs?: CSSProperties['marginBlockStart'];
		marginBlockStart?: CSSProperties['marginBlockStart'];
		mbe?: CSSProperties['marginBlockEnd'];
		marginBlockEnd?: CSSProperties['marginBlockEnd'];
		mi?: CSSProperties['marginInline'];
		marginInline?: CSSProperties['marginInline'];
		mis?: CSSProperties['marginInlineStart'];
		marginInlineStart?: CSSProperties['marginInlineStart'];
		mie?: CSSProperties['marginInlineEnd'];
		marginInlineEnd?: CSSProperties['marginInlineEnd'];
		p?: CSSProperties['padding'];
		padding?: CSSProperties['padding'];
		pb?: CSSProperties['paddingBlock'];
		paddingBlock?: CSSProperties['paddingBlock'];
		pbs?: CSSProperties['paddingBlockStart'];
		paddingBlockStart?: CSSProperties['paddingBlockStart'];
		pbe?: CSSProperties['paddingBlockEnd'];
		paddingBlockEnd?: CSSProperties['paddingBlockEnd'];
		pi?: CSSProperties['paddingInline'];
		paddingInline?: CSSProperties['paddingInline'];
		pis?: CSSProperties['paddingInlineStart'];
		paddingInlineStart?: CSSProperties['paddingInlineStart'];
		pie?: CSSProperties['paddingInlineEnd'];
		paddingInlineEnd?: CSSProperties['paddingInlineEnd'];

		fontFamily?: CSSProperties['fontFamily'] | FontScale;
		fontSize?: CSSProperties['fontSize'] | FontScale;
		fontStyle?: CSSProperties['fontStyle'];
		fontWeight?: CSSProperties['fontWeight'] | FontScale;
		letterSpacing?: CSSProperties['letterSpacing'] | FontScale;
		lineHeight?: CSSProperties['lineHeight'] | FontScale;
		textAlign?: CSSProperties['textAlign'];
		textTransform?: CSSProperties['textTransform'];
		textDecorationLine?: CSSProperties['textDecorationLine'];

		elevation?: '0' | '1' | '2';
		invisible?: boolean;
		withRichContent?: boolean;
		withTruncatedText?: boolean;
		size?: CSSProperties['blockSize'];
		minSize?: CSSProperties['blockSize'];
		maxSize?: CSSProperties['blockSize'];
		fontScale?: FontScale;
	}> & Omit<AllHTMLAttributes<HTMLOrSVGElement>, 'className'> & RefAttributes<unknown>;

	export const Box: ForwardRefExoticComponent<BoxProps>;

	type AccordionProps = BoxProps;
	type AccordionItemProps = Omit<BoxProps, 'title'> & {
		defaultExpanded?: boolean;
		title?: string;
	};
	export const Accordion: ForwardRefExoticComponent<AccordionProps> & {
		Item: ForwardRefExoticComponent<AccordionItemProps>;
	};

	type ButtonProps = BoxProps & {
		primary?: boolean;
		ghost?: boolean;
		danger?: boolean;
	};
	export const Button: ForwardRefExoticComponent<ButtonProps>;

	type ButtonGroupProps = BoxProps & {
		align?: 'start' | 'center' | 'end';
		stretch?: boolean;
		wrap?: boolean;
		vertical?: boolean;
	};
	export const ButtonGroup: ForwardRefExoticComponent<ButtonGroupProps>;

	type CalloutProps = BoxProps;
	export const Callout: ForwardRefExoticComponent<CalloutProps>;

	type ChevronProps = Omit<BoxProps, 'size'> & {
		size?: BoxProps['width'];
		right?: boolean;
		left?: boolean;
		top?: boolean;
		bottom?: boolean;
	};
	export const Chevron: ForwardRefExoticComponent<ChevronProps>;

	type FieldProps = BoxProps;
	export const Field: ForwardRefExoticComponent<FieldProps> & {
		Row: ForwardRefExoticComponent<BoxProps>;
		Label: ForwardRefExoticComponent<BoxProps>;
		Hint: ForwardRefExoticComponent<BoxProps>;
		Error: ForwardRefExoticComponent<BoxProps>;
	};

	type FieldGroupProps = BoxProps;
	export const FieldGroup: ForwardRefExoticComponent<FieldGroupProps>;

	type IconProps = Omit<BoxProps, 'size'> & {
		size?: BoxProps['width'];
	};
	export const Icon: ForwardRefExoticComponent<IconProps>;

	type InputBoxProps = BoxProps;
	export const InputBox: ForwardRefExoticComponent<InputBoxProps>;

	type NumberInputProps = BoxProps;
	export const NumberInput: ForwardRefExoticComponent<NumberInputProps>;

	type TextAreaInputProps = BoxProps;
	export const TextAreaInput: ForwardRefExoticComponent<TextAreaInputProps>;

	type TileProps = BoxProps;
	export const Tile: ForwardRefExoticComponent<TileProps>;

	type ThrobberProps = Omit<BoxProps, 'size'> & {
		size?: BoxProps['width'];
		inheritColor?: boolean;
	};
	export const Throbber: ForwardRefExoticComponent<ThrobberProps>;

	type ToggleSwitchProps = BoxProps;
	export const ToggleSwitch: ForwardRefExoticComponent<ToggleSwitchProps>;

	type TextInputProps = BoxProps & {
		error?: string;
	};
	export const TextInput: ForwardRefExoticComponent<TextInputProps>;

	type MarginsProps = PropsWithChildren<{
		all?: BoxProps['margin'];
		block?: BoxProps['marginBlock'];
		blockStart?: BoxProps['marginBlockStart'];
		blockEnd?: BoxProps['marginBlockEnd'];
		inline?: BoxProps['marginInline'];
		inlineStart?: BoxProps['marginInlineStart'];
		inlineEnd?: BoxProps['marginInlineEnd'];
	}>;
	export const Margins: ForwardRefExoticComponent<MarginsProps>;

	type ScrollableProps = PropsWithChildren<{
		horizontal?: boolean;
		vertical?: boolean;
		onScrollContent?: (touching: { top: boolean }) => void;
	}>;
	export const Scrollable: ForwardRefExoticComponent<ScrollableProps>;

	type SelectOptions = [string, string][];
	type SelectProps = BoxProps & {
		error?: string;
		options: SelectOptions;
	};
	export const Select: ForwardRefExoticComponent<SelectProps>;

	export const Divider: React.FC;
}
