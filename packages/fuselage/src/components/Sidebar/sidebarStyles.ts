import { statusBackgroundColors, statusColors, strokeColors, surfaceColors, textIconColors } from '../../Theme';
import { toCSSValue } from '../../helpers/toCSSValue';
import { borderRadius, borderWidth, fontFamily, fontScale } from '../../styleTokens';
import type { FontScaleName } from '../../styleTokens';

export const sidebarColorSurfaceDefault = toCSSValue('--rcx-sidebar-color-surface-default', surfaceColors['surface-sidebar']);
export const sidebarColorSurfaceHover = toCSSValue('--rcx-sidebar-color-surface-hover', surfaceColors['surface-hover']);
export const sidebarColorFontActive = toCSSValue('--rcx-sidebar-color-font-active', textIconColors['font-titles-labels']);
export const sidebarColorStrokeExtraLight = toCSSValue('--rcx-sidebar-color-stroke-extra-light', strokeColors['stroke-light']);
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

/** A collapsed sidebar keeps this text out of sight, on one line, until it is hovered. */
export const hiddenWhileCollapsed = {
	visibility: { 'default': 'hidden', 'group-hover/rcx-sidebar': 'visible' },
	whiteSpace: { 'default': 'nowrap', 'group-hover/rcx-sidebar': 'inherit' },
} as const;

/**
 * Style props for the frame of another component the sidebar renders, such as an `Item` part or a `Chevron`. Those hand the
 * props they don't use to their Tamagui frame, where props win over the frame's own styles, as the sidebar's stylesheet used to.
 */
export const frameStyle = (style: Record<string, unknown>) => style as Record<never, never>;

/** The keyboard focus look of the sidebar's own clickable bars: a highlighted border instead of a ring. */
export const focusBorder = {
	borderWidth: borderWidth('default'),
	borderStyle: 'solid',
	borderColor: { 'default': 'transparent', 'focus-visible': strokeColors['stroke-highlight'].toString() },
	outlineStyle: 'none',
	boxShadow: { 'focus-visible': 'none' },
} as const;

export const focusBorderRadius = toCSSValue('--rcx-border-radius-medium', borderRadius('medium'));

export const typography = (name: FontScaleName) => {
	const { fontSize, fontWeight, lineHeight, letterSpacing } = fontScale(name);

	return { fontSize, fontWeight: String(fontWeight) as `${number}`, lineHeight, letterSpacing };
};
