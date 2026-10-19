import badge from '@rocket.chat/fuselage-tokens/dist/badge.json';
import colors from '@rocket.chat/fuselage-tokens/dist/colors.json';
import font from '@rocket.chat/fuselage-tokens/dist/font.json';
import shadow from '@rocket.chat/fuselage-tokens/dist/shadow.json';
import status from '@rocket.chat/fuselage-tokens/dist/status.json';
import stroke from '@rocket.chat/fuselage-tokens/dist/stroke.json';
import surface from '@rocket.chat/fuselage-tokens/dist/surface.json';

import { toCSSColorValue } from './helpers/toCSSValue';

export class Var {
	private name: string;

	private value: string;

	constructor(name: string, value: string) {
		this.name = name;
		this.value = value;
	}

	toString() {
		return toCSSColorValue(this.name, this.value);
	}

	theme(name: string) {
		return new Var(name, this.toString());
	}
}

export let throwErrorOnInvalidToken = false;
// eslint-disable-next-line @typescript-eslint/naming-convention
export const __setThrowErrorOnInvalidToken__ = (value: boolean) => {
	throwErrorOnInvalidToken = value;
};

export const neutral = {
	100: new Var('neutral-100', colors.n100),
	200: new Var('neutral-200', colors.n200),
	250: new Var('neutral-250', colors.n250),
	300: new Var('neutral-300', colors.n300),
	400: new Var('neutral-400', colors.n400),
	450: new Var('neutral-450', colors.n450),
	500: new Var('neutral-500', colors.n500),
	600: new Var('neutral-600', colors.n600),
	700: new Var('neutral-700', colors.n700),
	800: new Var('neutral-800', colors.n800),
	900: new Var('neutral-900', colors.n900),
};

const surfaceTokens = surface.light;

export const surfaceColors = {
	'surface-light': new Var('surface-light', surfaceTokens.light),
	'surface-tint': new Var('surface-tint', surfaceTokens.tint),
	'surface-room': new Var('surface-room', surfaceTokens.room),
	'surface-neutral': new Var('surface-neutral', surfaceTokens.neutral),
	'surface-disabled': new Var('surface-disabled', surfaceTokens.disabled),
	'surface-hover': new Var('surface-hover', surfaceTokens.hover),
	'surface-selected': new Var('surface-selected', surfaceTokens.selected),
	'surface-dark': new Var('surface-dark', surfaceTokens.dark),
	'surface-featured': new Var('surface-featured', surfaceTokens.featured),
	'surface-featured-hover': new Var('surface-featured-hover', surfaceTokens.featuredHover),
	'surface-overlay': new Var('surface-overlay', surfaceTokens.overlay),
	'surface-transparent': 'transparent',
	'surface-sidebar': new Var('surface-sidebar', surfaceTokens.sidebar),
};

type SurfaceColors = keyof typeof surfaceColors;

const strokeTokens = stroke.light;

export const strokeColors = {
	'stroke-extra-light': new Var('stroke-extra-light', strokeTokens.extraLight),
	'stroke-light': new Var('stroke-light', strokeTokens.light),
	'stroke-medium': new Var('stroke-medium', strokeTokens.medium),
	'stroke-dark': new Var('stroke-dark', strokeTokens.dark),
	'stroke-extra-dark': new Var('stroke-extra-dark', strokeTokens.extraDark),
	'stroke-extra-light-highlight': new Var('stroke-extra-light-highlight', strokeTokens.extraLightHighlight),
	'stroke-highlight': new Var('stroke-highlight', strokeTokens.highlight),
	'stroke-extra-light-error': new Var('stroke-extra-light-error', strokeTokens.extraLightError),
	'stroke-error': new Var('stroke-error', strokeTokens.error),
};

type StrokeColor = keyof typeof strokeColors;

const fontTokens = font.light;

export const textIconColors = {
	'font-white': new Var('font-white', fontTokens.white),
	'font-disabled': new Var('font-disabled', fontTokens.disabled),
	'font-annotation': new Var('font-annotation', fontTokens.annotation),
	'font-hint': new Var('font-hint', fontTokens.hint),
	'font-secondary-info': new Var('font-secondary-info', fontTokens.secondaryInfo),
	'font-default': new Var('font-default', fontTokens.default),
	'font-titles-labels': new Var('font-titles-labels', fontTokens.titlesLabels),
	'font-info': new Var('font-info', fontTokens.info),
	'font-danger': new Var('font-danger', fontTokens.danger),
	'font-pure-black': new Var('font-pure-black', fontTokens.pureBlack),
	'font-pure-white': new Var('font-pure-white', fontTokens.pureWhite),
};

type TextIconColors = keyof typeof textIconColors;

const statusTokens = status.light;

export const statusBackgroundColors = {
	'status-background-info': new Var('status-background-info', statusTokens.info),
	'status-background-success': new Var('status-background-success', statusTokens.success),
	'status-background-danger': new Var('status-background-danger', statusTokens.danger),
	'status-background-warning': new Var('status-background-warning', statusTokens.warning),
	'status-background-warning-2': new Var('status-background-warning-2', statusTokens['warning-2']),
	'status-background-service-1': new Var('status-background-service-1', statusTokens['service-1']),
	'status-background-service-2': new Var('status-background-service-2', statusTokens['service-2']),
};

type StatusBackgroundColors = keyof typeof statusBackgroundColors;

export const statusColors = {
	'status-font-on-info': new Var('status-font-on-info', statusTokens['font-on-info']),
	'status-font-on-success': new Var('status-font-on-success', statusTokens['font-on-success']),
	'status-font-on-warning': new Var('status-font-on-warning', statusTokens['font-on-warning']),
	'status-font-on-warning-2': new Var('status-font-on-warning-2', statusTokens['font-on-warning-2']),
	'status-font-on-danger': new Var('status-font-on-danger', statusTokens['font-on-danger']),
	'status-font-on-service-1': new Var('status-font-on-service-1', statusTokens['font-on-service-1']),
	'status-font-on-service-2': new Var('status-font-on-service-2', statusTokens['font-on-service-2']),
};

type StatusColors = keyof typeof statusColors;

const badgeTokens = badge.light;

export const badgeBackgroundColors = {
	'badge-background-level-0': new Var('badge-background-level-0', badgeTokens['level-0']),
	'badge-background-level-1': new Var('badge-background-level-1', badgeTokens['level-1']),
	'badge-background-level-2': new Var('badge-background-level-2', badgeTokens['level-2']),
	'badge-background-level-3': new Var('badge-background-level-3', badgeTokens['level-3']),
	'badge-background-level-4': new Var('badge-background-level-4', badgeTokens['level-4']),
};

type BadgeBackgroundColors = keyof typeof badgeBackgroundColors;

const shadowTokens = shadow.light;

export const shadowColors = {
	'shadow-elevation-border': new Var('shadow-elevation-border', shadowTokens['elevation-border']),
	'shadow-elevation-1': new Var('shadow-elevation-1', shadowTokens['elevation-1']),
	'shadow-elevation-2x': new Var('shadow-elevation-2x', shadowTokens['elevation-2x']),
	'shadow-elevation-2y': new Var('shadow-elevation-2y', shadowTokens['elevation-2y']),
	'shadow-highlight': new Var('shadow-highlight', shadowTokens.highlight),
	'shadow-danger': new Var('shadow-danger', shadowTokens.danger),
};

type ShadowColors = keyof typeof shadowColors;

export const isSurfaceColor = (color: unknown): color is SurfaceColors => typeof color === 'string' && color in surfaceColors;

export const isStrokeColor = (color: unknown): color is StrokeColor => typeof color === 'string' && color in strokeColors;

export const isTextIconColor = (color: unknown): color is TextIconColors => typeof color === 'string' && color in textIconColors;

export const isBadgeColor = (color: unknown): color is BadgeBackgroundColors => typeof color === 'string' && color in badgeBackgroundColors;

export const isStatusBackgroundColor = (color: unknown): color is StatusBackgroundColors =>
	typeof color === 'string' && color in statusBackgroundColors;

export const isStatusColor = (color: unknown): color is StatusColors => typeof color === 'string' && color in statusColors;

export const isShadowColor = (color: unknown): color is ShadowColors => typeof color === 'string' && color in shadowColors;

export const Palette = {
	surface: surfaceColors,
	status: statusBackgroundColors,
	statusColor: statusColors,
	badge: badgeBackgroundColors,
	text: textIconColors,
	stroke: strokeColors,
	shadow: shadowColors,
};
