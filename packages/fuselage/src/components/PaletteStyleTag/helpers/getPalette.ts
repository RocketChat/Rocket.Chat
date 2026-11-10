import badge from '@rocket.chat/fuselage-tokens/dist/badge.json';
import button from '@rocket.chat/fuselage-tokens/dist/button.json';
import font from '@rocket.chat/fuselage-tokens/dist/font.json';
import shadow from '@rocket.chat/fuselage-tokens/dist/shadow.json';
import status from '@rocket.chat/fuselage-tokens/dist/status.json';
import statusBullet from '@rocket.chat/fuselage-tokens/dist/statusBullet.json';
import stroke from '@rocket.chat/fuselage-tokens/dist/stroke.json';
import surface from '@rocket.chat/fuselage-tokens/dist/surface.json';

import type { Themes } from '../types/themes';

export const getTokens = (theme: Themes) => {
	const tokens = {
		badge: badge[theme],
		button: button[theme],
		font: font[theme],
		shadow: shadow[theme],
		status: status[theme],
		statusBullet: statusBullet[theme],
		stroke: stroke[theme],
		surface: surface[theme],
	};

	return tokens;
};

export const getThemePalette = (theme: Themes) => {
	const { badge, button, font, shadow, status, statusBullet, stroke, surface } = getTokens(theme);

	const palette = [
		{
			category: 'Stroke',
			description: "Use as component's outline, stroke, dividers",
			list: [
				{ name: 'stroke-extra-light', color: stroke.extraLight },
				{ name: 'stroke-light', color: stroke.light },
				{ name: 'stroke-medium', color: stroke.medium },
				{ name: 'stroke-dark', color: stroke.dark },
				{ name: 'stroke-extra-dark', color: stroke.extraDark },
				{
					name: 'stroke-extra-light-highlight',
					color: stroke.extraLightHighlight,
				},
				{ name: 'stroke-highlight', color: stroke.highlight },
				{ name: 'stroke-extra-light-error', color: stroke.extraLightError },
				{ name: 'stroke-error', color: stroke.error },
			],
		},
		{
			category: 'Surface',
			description: 'Use as a container on top of the background',
			list: [
				{ name: 'surface-light', color: surface.light },
				{ name: 'surface-tint', color: surface.tint },
				{ name: 'surface-room', color: surface.room },
				{ name: 'surface-neutral', color: surface.neutral },
				{ name: 'surface-disabled', color: surface.disabled },
				{ name: 'surface-hover', color: surface.hover },
				{ name: 'surface-selected', color: surface.selected },
				{ name: 'surface-dark', color: surface.dark },
				{ name: 'surface-featured', color: surface.featured },
				{ name: 'surface-featured-hover', color: surface.featuredHover },
				{ name: 'surface-overlay', color: surface.overlay },
				{ name: 'surface-sidebar', color: surface.sidebar },
			],
		},
		{
			category: 'Shadow',
			description: 'Use as a shadow color',
			list: [
				{ name: 'shadow-highlight', color: shadow.highlight },
				{ name: 'shadow-danger', color: shadow.danger },
				{ name: 'shadow-elevation-border', color: shadow['elevation-border'] },
				{ name: 'shadow-elevation-1', color: shadow['elevation-1'] },
				{
					name: 'shadow-elevation-2x',
					color: shadow['elevation-2x'],
				},
				{
					name: 'shadow-elevation-2y',
					color: shadow['elevation-2y'],
				},
			],
		},
		{
			category: 'Font',
			description: 'These should be applied according to surfaces',
			list: [
				{ name: 'font-white', color: font.white },
				{ name: 'font-disabled', color: font.disabled },
				{ name: 'font-annotation', color: font.annotation },
				{ name: 'font-hint', color: font.hint },
				{ name: 'font-secondary-info', color: font.secondaryInfo },
				{ name: 'font-default', color: font.default },
				{ name: 'font-titles-labels', color: font.titlesLabels },
				{ name: 'font-info', color: font.info },
				{ name: 'font-danger', color: font.danger },
				{ name: 'font-pure-black', color: font.pureBlack },
				{ name: 'font-pure-white', color: font.pureWhite },
			],
		},
		{
			category: 'Status',
			description: 'Status Background',
			list: [
				{ name: 'status-background-info', color: status.info },
				{ name: 'status-background-success', color: status.success },
				{ name: 'status-background-danger', color: status.danger },
				{ name: 'status-background-warning', color: status.warning },
				{ name: 'status-background-warning-2', color: status['warning-2'] },
				{
					name: 'status-background-service-1',
					color: status['service-1'],
				},
				{
					name: 'status-background-service-2',
					color: status['service-2'],
				},
				{
					name: 'status-background-service-3',
					color: status['service-3'],
				},
			],
		},
		{
			description: 'Status Font',
			list: [
				{ name: 'status-font-on-info', color: status['font-on-info'] },
				{ name: 'status-font-on-success', color: status['font-on-success'] },
				{ name: 'status-font-on-danger', color: status['font-on-danger'] },
				{ name: 'status-font-on-warning', color: status['font-on-warning'] },
				{
					name: 'status-font-on-warning-2',
					color: status['font-on-warning-2'],
				},
				{
					name: 'status-font-on-service-1',
					color: status['font-on-service-1'],
				},
				{
					name: 'status-font-on-service-2 ',
					color: status['font-on-service-2'],
				},
				{
					name: 'status-font-on-service-3 ',
					color: status['font-on-service-3'],
				},
			],
		},
		{
			category: 'Badge',
			description: 'Badge Background',
			list: [
				{ name: 'badge-background-level-0', color: badge['level-0'] },
				{ name: 'badge-background-level-1', color: badge['level-1'] },
				{ name: 'badge-background-level-2', color: badge['level-2'] },
				{ name: 'badge-background-level-3', color: badge['level-3'] },
				{ name: 'badge-background-level-4', color: badge['level-4'] },
			],
		},
		{
			category: 'Status Bullet',
			description: 'Used to show user status',
			list: [
				{ name: 'status-bullet-online', color: statusBullet.online },
				{ name: 'status-bullet-away', color: statusBullet.away },
				{ name: 'status-bullet-busy', color: statusBullet.busy },
				{ name: 'status-bullet-disabled', color: statusBullet.disabled },
				{ name: 'status-bullet-offline', color: statusBullet.offline },
				{ name: 'status-bullet-loading', color: statusBullet.loading },
			],
		},
		{
			category: 'Button',
			description: 'Primary Background',
			list: [
				{
					name: 'button-background-primary-default',
					color: button.backgroundPrimaryDefault,
				},
				{
					name: 'button-background-primary-hover',
					color: button.backgroundPrimaryHover,
				},
				{
					name: 'button-background-primary-press',
					color: button.backgroundPrimaryPress,
				},
				{
					name: 'button-background-primary-focus',
					color: button.backgroundPrimaryFocus,
				},
				{
					name: 'button-background-primary-keyfocus',
					color: button.backgroundPrimaryKeyfocus,
				},
				{
					name: 'button-background-primary-disabled',
					color: button.backgroundPrimaryDisabled,
				},
			],
		},
		{
			description: 'Secondary Background',
			list: [
				{
					name: 'button-background-secondary-default',
					color: button.backgroundSecondaryDefault,
				},
				{
					name: 'button-background-secondary-hover',
					color: button.backgroundSecondaryHover,
				},
				{
					name: 'button-background-secondary-press',
					color: button.backgroundSecondaryPress,
				},
				{
					name: 'button-background-secondary-focus',
					color: button.backgroundSecondaryFocus,
				},
				{
					name: 'button-background-secondary-keyfocus',
					color: button.backgroundSecondaryKeyfocus,
				},
				{
					name: 'button-background-secondary-disabled',
					color: button.backgroundSecondaryDisabled,
				},
			],
		},
		{
			description: 'Secondary Danger Background',
			list: [
				{
					name: 'button-background-secondary-danger-default',
					color: button.backgroundSecondaryDangerDefault,
				},
				{
					name: 'button-background-secondary-danger-hover',
					color: button.backgroundSecondaryDangerHover,
				},
				{
					name: 'button-background-secondary-danger-press',
					color: button.backgroundSecondaryDangerPress,
				},
				{
					name: 'button-background-secondary-danger-focus',
					color: button.backgroundSecondaryDangerFocus,
				},
				{
					name: 'button-background-secondary-danger-keyfocus',
					color: button.backgroundSecondaryDangerKeyfocus,
				},
				{
					name: 'button-background-secondary-danger-disabled',
					color: button.backgroundDangerDisabled,
				},
			],
		},
		{
			description: 'Danger Background',
			list: [
				{
					name: 'button-background-danger-default',
					color: button.backgroundDangerDefault,
				},
				{
					name: 'button-background-danger-hover',
					color: button.backgroundDangerHover,
				},
				{
					name: 'button-background-danger-press',
					color: button.backgroundDangerPress,
				},
				{
					name: 'button-background-danger-focus',
					color: button.backgroundDangerFocus,
				},
				{
					name: 'button-background-danger-keyfocus',
					color: button.backgroundDangerKeyfocus,
				},
				{
					name: 'button-background-danger-disabled',
					color: button.backgroundDangerDisabled,
				},
			],
		},
		{
			description: 'Success Background',
			list: [
				{
					name: 'button-background-success-default',
					color: button.backgroundSuccessDefault,
				},
				{
					name: 'button-background-success-hover',
					color: button.backgroundSuccessHover,
				},
				{
					name: 'button-background-success-press',
					color: button.backgroundSuccessPress,
				},
				{
					name: 'button-background-success-focus',
					color: button.backgroundSuccessFocus,
				},
				{
					name: 'button-background-success-keyfocus',
					color: button.backgroundSuccessKeyfocus,
				},
				{
					name: 'button-background-success-disabled',
					color: button.backgroundSuccessDisabled,
				},
			],
		},
		{
			description: 'Font',
			list: [
				{ name: 'button-font-on-primary', color: button.fontOnPrimary },
				{
					name: 'button-font-on-primary-disabled',
					color: button.fontOnPrimaryDisabled,
				},
				{
					name: 'button-font-on-secondary',
					color: button.fontOnSecondary,
				},
				{
					name: 'button-font-on-secondary-disabled',
					color: button.fontOnSecondaryDisabled,
				},
				{
					name: 'button-font-on-secondary-danger',
					color: button.fontOnSecondaryDanger,
				},
				{
					name: 'button-font-on-secondary-danger-disabled',
					color: button.onSecondaryDangerDisabled,
				},
				{ name: 'button-font-on-danger', color: button.fontOnDanger },
				{
					name: 'button-font-on-danger-disabled',
					color: button.fontOnDangerDisabled,
				},
				{ name: 'button-font-on-success', color: button.fontOnSuccess },
				{
					name: 'button-font-on-success-disabled',
					color: button.fontOnSuccessDisabled,
				},
			],
		},
	];

	return {
		...palette.reduce(
			(rec, group) => ({
				...rec,
				...group.list.reduce(
					(rec, item) => ({
						...rec,
						[item.name]: item.color,
					}),
					{} as Record<string, string>,
				),
			}),
			{} as Record<string, string>,
		),
	};
};
