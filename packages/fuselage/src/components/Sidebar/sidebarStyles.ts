import { statusBackgroundColors, statusColors, strokeColors, surfaceColors, textIconColors } from '../../Theme';
import { toCSSValue } from '../../helpers/toCSSValue';
import { fontFamily, fontScale } from '../../styleTokens';

export const sidebarColorSurfaceDefault = toCSSValue('--rcx-sidebar-color-surface-default', surfaceColors['surface-sidebar']);
export const sidebarColorFontDefault = toCSSValue('--rcx-sidebar-color-font-default', textIconColors['font-default']);
export const sidebarAccordionBorderColor = toCSSValue('--rcx-sidebar-accordion-border-color', strokeColors['stroke-light']);

// The colored banners read their font color from the `background` custom property, as the SCSS version did
export const sidebarBannerColors = {
	default: {
		backgroundColor: toCSSValue('--rcx-sidebar-banner-background-default', surfaceColors['surface-sidebar']),
		color: toCSSValue('--rcx-sidebar-banner-color-default', textIconColors['font-titles-labels']),
	},
	info: {
		backgroundColor: toCSSValue('--rcx-sidebar-banner-background-info', statusBackgroundColors['status-background-info']),
		color: toCSSValue('--rcx-sidebar-banner-background-info', statusColors['status-font-on-info']),
	},
	success: {
		backgroundColor: toCSSValue('--rcx-sidebar-banner-background-success', statusBackgroundColors['status-background-success']),
		color: toCSSValue('--rcx-sidebar-banner-background-success', statusColors['status-font-on-success']),
	},
	warning: {
		backgroundColor: toCSSValue('--rcx-sidebar-banner-background-warning', statusBackgroundColors['status-background-warning']),
		color: toCSSValue('--rcx-sidebar-banner-background-warning', statusColors['status-font-on-warning']),
	},
	danger: {
		backgroundColor: toCSSValue('--rcx-sidebar-banner-background-danger', statusBackgroundColors['status-background-danger']),
		color: toCSSValue('--rcx-sidebar-banner-background-danger', statusColors['status-font-on-danger']),
	},
} as const;

/** What a plain element had before becoming a frame: it shrinks in a flex parent and keeps its content-based minimum size. */
export const plainElement = {
	boxSizing: 'content-box',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
} as const;

/** What `rcx-box rcx-box--full` gave an element before it became a frame. */
export const boxFull = {
	...plainElement,
	boxSizing: 'border-box',
	margin: 0,
	padding: 0,
	borderWidth: 0,
	borderStyle: 'solid',
	borderColor: 'currentColor',
	outlineStyle: 'none',
	fontFamily: fontFamily('sans'),
	fontVariantNumeric: 'tabular-nums',
} as const;

export const textEllipsis = {
	overflow: 'hidden',
	textOverflow: 'ellipsis',
} as const;

export const typography = (name: string) => {
	const { fontSize, fontWeight, lineHeight, letterSpacing } = fontScale(name)!;

	return { fontSize, fontWeight: String(fontWeight) as `${number}`, lineHeight, letterSpacing };
};
