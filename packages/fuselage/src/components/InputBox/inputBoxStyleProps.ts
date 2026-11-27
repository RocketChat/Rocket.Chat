import { Palette } from '../../Theme';
import { fontColor } from '../../styleTokens';
import { nativeColor } from '../Box/nativeStyle';
import type { StylingProps } from '../Box/stylingProps';

export type InputBoxChromeState = {
	focused?: boolean;
	invalid?: boolean;
	disabled?: boolean;
	small?: boolean;
};

type ChromeProps = Pick<
	StylingProps,
	'borderWidth' | 'borderColor' | 'borderRadius' | 'backgroundColor' | 'minHeight' | 'paddingBlock' | 'paddingInline'
>;

/** The border, background and padding the web draws around an input, from the same tokens as `InputBox.styles.scss`. */
export const inputBoxChrome = ({ focused, invalid, disabled, small }: InputBoxChromeState): ChromeProps => {
	let borderColor = invalid ? 'error' : 'light';
	if (disabled) {
		borderColor = 'light';
	} else if (focused) {
		borderColor = invalid ? 'error' : 'highlight';
	}

	return {
		borderWidth: 'default',
		borderColor,
		borderRadius: 'medium',
		backgroundColor: disabled ? 'disabled' : 'light',
		minHeight: small ? 28 : 40,
		paddingBlock: small ? 4 : 8,
		paddingInline: small ? 8 : 15,
	};
};

/** The focus ring the web draws as a box shadow outside the border. */
export const inputBoxFocusRing = ({ focused, invalid, disabled }: InputBoxChromeState) =>
	focused && !disabled
		? { boxShadow: `0px 0px 0px 2px ${nativeColor(Palette.shadow[invalid ? 'shadow-danger' : 'shadow-highlight'].toString())}` }
		: undefined;

/** The type of the text inside the input, and the colour of its placeholder. */
export const inputBoxText = ({
	disabled,
	small,
}: InputBoxChromeState): Pick<StylingProps, 'color' | 'fontScale'> & { placeholderTextColor?: string | number } => ({
	color: disabled ? 'disabled' : 'titles-labels',
	fontScale: small ? 'c1' : 'p2m',
	placeholderTextColor: nativeColor(fontColor(disabled ? 'disabled' : 'hint')),
});

/** The row an input sits in when it has an addon: the web's wrapper, with the addons' margins as a gap. */
export const inputBoxWrapperLayout = ({
	small,
	textarea,
	endAddonFlush,
}: {
	small?: boolean;
	textarea?: boolean;
	endAddonFlush?: boolean;
}) => ({
	flexDirection: 'row' as const,
	alignItems: textarea ? ('flex-start' as const) : ('center' as const),
	gap: 8,
	...(small && { maxHeight: 28 }),
	...(endAddonFlush && { paddingBlock: 4, paddingInlineEnd: 4 }),
});

/** The input inside a wrapper takes the room the addons leave, and carries none of the chrome. */
export const inputBoxUndecorated = { flexGrow: 1, flexShrink: 1, minWidth: 0 } as const;
