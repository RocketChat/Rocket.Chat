import { themed } from './frameTokens.mts';
import { statusPalettes, statusTones } from './statusPalettes.mts';
import type { StatusTone } from './statusPalettes.mts';
import { backgroundColor, fontColor, strokeColor } from '../../../src/styleTokens.ts';

type BannerColors = { background: string; color: string };

/** The colours of the Sidebar and its parts, under the `--rcx-sidebar-*` custom properties a theme can override. */
export const sidebarPalettes = () => {
	const status = statusPalettes();
	const tone = (name: StatusTone): BannerColors => ({
		background: themed(`sidebar-banner-background-${name}`, status[name].background),
		color: themed(`sidebar-banner-color-${name}`, status[name].font),
	});

	return {
		surface: {
			default: themed('sidebar-color-surface-default', backgroundColor('sidebar')),
			hover: themed('sidebar-color-surface-hover', backgroundColor('hover')),
			selected: themed('sidebar-color-surface-selected', backgroundColor('selected')),
		},
		font: {
			default: themed('sidebar-color-font-default', fontColor('default')),
			link: themed('sidebar-link-color', fontColor('titles-labels')),
			highlighted: themed('sidebar-item-color-highlighted', fontColor('titles-labels')),
		},
		accordionBorder: themed('sidebar-accordion-border-color', strokeColor('light')),
		banner: {
			default: {
				background: themed('sidebar-banner-background-default', backgroundColor('sidebar')),
				color: themed('sidebar-banner-color-default', fontColor('titles-labels')),
			},
			...(Object.fromEntries(statusTones.map((name) => [name, tone(name)])) as Record<StatusTone, BannerColors>),
		},
	};
};
