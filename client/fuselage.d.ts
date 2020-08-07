declare module '@rocket.chat/fuselage' {
	import { createElement, CSSProperties, RefForwardingComponent, AllHTMLAttributes } from 'react';
	import { css } from '@rocket.chat/css-in-js';

	type Component = Parameters<typeof createElement>[0];

	type CssClassName = ReturnType<typeof css>;
	type BoxSimpleClassName = string | CssClassName;
	type BoxClassName = BoxSimpleClassName | BoxSimpleClassName[];
	type FontScale = 'h1' | 's1' | 's2' | 'p1' | 'p2' | 'c1' | 'c2' | 'micro';

	type BoxProps<T> = AllHTMLAttributes<T> & {
		is?: Component;
		className?: BoxClassName;
		style?: CSSProperties;
		border?: Pick<CSSProperties, 'border'>;
		borderBlock?: Pick<CSSProperties, 'borderBlock'>;
		borderBlockStart?: Pick<CSSProperties, 'borderBlockStart'>;
		borderBlockEnd?: Pick<CSSProperties, 'borderBlockEnd'>;
		borderInline?: Pick<CSSProperties, 'borderInline'>;
		borderInlineStart?: Pick<CSSProperties, 'borderInlineStart'>;
		borderInlineEnd?: Pick<CSSProperties, 'borderInlineEnd'>;
		borderWidth?: Pick<CSSProperties, 'borderWidth'>;
		borderBlockWidth?: Pick<CSSProperties, 'borderBlockWidth'>;
		borderBlockStartWidth?: Pick<CSSProperties, 'borderBlockStartWidth'>;
		borderBlockEndWidth?: Pick<CSSProperties, 'borderBlockEndWidth'>;
		borderInlineWidth?: Pick<CSSProperties, 'borderInlineWidth'>;
		borderInlineStartWidth?: Pick<CSSProperties, 'borderInlineStartWidth'>;
		borderInlineEndWidth?: Pick<CSSProperties, 'borderInlineEndWidth'>;
		borderStyle?: Pick<CSSProperties, 'borderStyle'>;
		borderBlockStyle?: Pick<CSSProperties, 'borderBlockStyle'>;
		borderBlockStartStyle?: Pick<CSSProperties, 'borderBlockStartStyle'>;
		borderBlockEndStyle?: Pick<CSSProperties, 'borderBlockEndStyle'>;
		borderInlineStyle?: Pick<CSSProperties, 'borderInlineStyle'>;
		borderInlineStartStyle?: Pick<CSSProperties, 'borderInlineStartStyle'>;
		borderInlineEndStyle?: Pick<CSSProperties, 'borderInlineEndStyle'>;
		borderColor?: Pick<CSSProperties, 'borderColor'>;
		borderBlockColor?: Pick<CSSProperties, 'borderBlockColor'>;
		borderBlockStartColor?: Pick<CSSProperties, 'borderBlockStartColor'>;
		borderBlockEndColor?: Pick<CSSProperties, 'borderBlockEndColor'>;
		borderInlineColor?: Pick<CSSProperties, 'borderInlineColor'>;
		borderInlineStartColor?: Pick<CSSProperties, 'borderInlineStartColor'>;
		borderInlineEndColor?: Pick<CSSProperties, 'borderInlineEndColor'>;
		borderRadius?: Pick<CSSProperties, 'borderRadius'>;
		borderStartStartRadius?: Pick<CSSProperties, 'borderStartStartRadius'>;
		borderStartEndRadius?: Pick<CSSProperties, 'borderStartEndRadius'>;
		borderEndStartRadius?: Pick<CSSProperties, 'borderEndStartRadius'>;
		borderEndEndRadius?: Pick<CSSProperties, 'borderEndEndRadius'>;

		color?: Pick<CSSProperties, 'color'>;
		backgroundColor?: Pick<CSSProperties, 'backgroundColor'>;
		bg?: Pick<CSSProperties, 'backgroundColor'>;
		opacity?: Pick<CSSProperties, 'opacity'>;

		alignItems?: Pick<CSSProperties, 'alignItems'>;
		alignContent?: Pick<CSSProperties, 'alignContent'>;
		justifyItems?: Pick<CSSProperties, 'justifyItems'>;
		justifyContent?: Pick<CSSProperties, 'justifyContent'>;
		flexWrap?: Pick<CSSProperties, 'flexWrap'>;
		flexDirection?: Pick<CSSProperties, 'flexDirection'>;
		flexGrow?: Pick<CSSProperties, 'flexGrow'>;
		flexShrink?: Pick<CSSProperties, 'flexShrink'>;
		flexBasis?: Pick<CSSProperties, 'flexBasis'>;
		justifySelf?: Pick<CSSProperties, 'justifySelf'>;
		alignSelf?: Pick<CSSProperties, 'alignSelf'>;
		order?: Pick<CSSProperties, 'order'>;

		w?: Pick<CSSProperties, 'width'>;
		width?: Pick<CSSProperties, 'width'>;
		minWidth?: Pick<CSSProperties, 'minWidth'>;
		maxWidth?: Pick<CSSProperties, 'maxWidth'>;
		h?: Pick<CSSProperties, 'height'>;
		height?: Pick<CSSProperties, 'height'>;
		minHeight?: Pick<CSSProperties, 'minHeight'>;
		maxHeight?: Pick<CSSProperties, 'maxHeight'>;
		display?: Pick<CSSProperties, 'display'>;
		verticalAlign?: Pick<CSSProperties, 'verticalAlign'>;
		overflow?: Pick<CSSProperties, 'overflow'>;
		overflowX?: Pick<CSSProperties, 'overflowX'>;
		overflowY?: Pick<CSSProperties, 'overflowY'>;

		position?: Pick<CSSProperties, 'position'>;
		zIndex?: Pick<CSSProperties, 'zIndex'>;
		inset?: Pick<CSSProperties, 'inset'>;
		insetBlock?: Pick<CSSProperties, 'insetBlock'>;
		insetBlockStart?: Pick<CSSProperties, 'insetBlockStart'>;
		insetBlockEnd?: Pick<CSSProperties, 'insetBlockEnd'>;
		insetInline?: Pick<CSSProperties, 'insetInline'>;
		insetInlineStart?: Pick<CSSProperties, 'insetInlineStart'>;
		insetInlineEnd?: Pick<CSSProperties, 'insetInlineEnd'>;

		m?: Pick<CSSProperties, 'margin'>;
		margin?: Pick<CSSProperties, 'margin'>;
		mb?: Pick<CSSProperties, 'marginBlock'>;
		marginBlock?: Pick<CSSProperties, 'marginBlock'>;
		mbs?: Pick<CSSProperties, 'marginBlockStart'>;
		marginBlockStart?: Pick<CSSProperties, 'marginBlockStart'>;
		mbe?: Pick<CSSProperties, 'marginBlockEnd'>;
		marginBlockEnd?: Pick<CSSProperties, 'marginBlockEnd'>;
		mi?: Pick<CSSProperties, 'marginInline'>;
		marginInline?: Pick<CSSProperties, 'marginInline'>;
		mis?: Pick<CSSProperties, 'marginInlineStart'>;
		marginInlineStart?: Pick<CSSProperties, 'marginInlineStart'>;
		mie?: Pick<CSSProperties, 'marginInlineEnd'>;
		marginInlineEnd?: Pick<CSSProperties, 'marginInlineEnd'>;
		p?: Pick<CSSProperties, 'padding'>;
		padding?: Pick<CSSProperties, 'padding'>;
		pb?: Pick<CSSProperties, 'paddingBlock'>;
		paddingBlock?: Pick<CSSProperties, 'paddingBlock'>;
		pbs?: Pick<CSSProperties, 'paddingBlockStart'>;
		paddingBlockStart?: Pick<CSSProperties, 'paddingBlockStart'>;
		pbe?: Pick<CSSProperties, 'paddingBlockEnd'>;
		paddingBlockEnd?: Pick<CSSProperties, 'paddingBlockEnd'>;
		pi?: Pick<CSSProperties, 'paddingInline'>;
		paddingInline?: Pick<CSSProperties, 'paddingInline'>;
		pis?: Pick<CSSProperties, 'paddingInlineStart'>;
		paddingInlineStart?: Pick<CSSProperties, 'paddingInlineStart'>;
		pie?: Pick<CSSProperties, 'paddingInlineEnd'>;
		paddingInlineEnd?: Pick<CSSProperties, 'paddingInlineEnd'>;

		fontFamily?: Pick<CSSProperties, 'fontFamily'> | FontScale;
		fontSize?: Pick<CSSProperties, 'fontSize'> | FontScale;
		fontStyle?: Pick<CSSProperties, 'fontStyle'>;
		fontWeight?: Pick<CSSProperties, 'fontWeight'> | FontScale;
		letterSpacing?: Pick<CSSProperties, 'letterSpacing'> | FontScale;
		lineHeight?: Pick<CSSProperties, 'lineHeight'> | FontScale;
		textAlign?: Pick<CSSProperties, 'textAlign'>;
		textTransform?: Pick<CSSProperties, 'textTransform'>;
		textDecorationLine?: Pick<CSSProperties, 'textDecorationLine'>;

		elevation?: '0' | '1' | '2';
		invisible?: boolean;
		withRichContent?: boolean;
		withTruncatedText?: boolean;
		size?: Pick<CSSProperties, 'blockSize'>;
		minSize?: Pick<CSSProperties, 'blockSize'>;
		maxSize?: Pick<CSSProperties, 'blockSize'>;
		fontScale?: FontScale;
	};

	export const Box: RefForwardingComponent<Element, BoxProps>;
}
