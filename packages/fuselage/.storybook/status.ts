// Keep in step with ../../storybook-config/src/status.ts, which Fuselage can't import: storybook-config depends on Fuselage.
import border from '@rocket.chat/fuselage-tokens/dist/border.json';
import button from '@rocket.chat/fuselage-tokens/dist/button.json';
import status from '@rocket.chat/fuselage-tokens/dist/status.json';
import surface from '@rocket.chat/fuselage-tokens/dist/surface.json';
import type { CSSProperties } from 'react';

type Mode = keyof typeof status;

type Colors = { color: string; backgroundColor: string };

type StatusDefinition = {
	label: string;
	description: string;
	colors: (mode: Mode) => Colors;
};

/** The lifecycle stages a component can be tagged with; stable components carry no tag. Each badge wears the colors of a Fuselage `Tag` variant. */
export const componentStatuses = {
	'experimental': {
		label: 'Experimental',
		description: 'New and still taking shape: its API may change without a major release.',
		colors: (mode) => ({ color: button[mode].fontOnPrimary, backgroundColor: surface[mode].featured }),
	},
	'under-review': {
		label: 'Under review',
		description: 'Being reconsidered: check with the design system team before adopting it.',
		colors: (mode) => ({ color: status[mode]['font-on-info'], backgroundColor: button[mode].backgroundSecondaryDefault }),
	},
	'legacy': {
		label: 'Legacy',
		description: 'Still supported, but superseded: prefer its replacement in new code.',
		colors: (mode) => ({ color: status[mode]['font-on-warning'], backgroundColor: button[mode].backgroundSecondaryDefault }),
	},
	'deprecated': {
		label: 'Deprecated',
		description: 'Scheduled for removal: migrate to its replacement.',
		colors: (mode) => ({ color: button[mode].fontOnSecondaryDanger, backgroundColor: button[mode].backgroundSecondaryDangerDefault }),
	},
	'internal': {
		label: 'Internal',
		description: "Built for this package's own screens, not for reuse elsewhere.",
		colors: (mode) => ({ color: button[mode].fontOnSecondary, backgroundColor: button[mode].backgroundSecondaryDefault }),
	},
} satisfies Record<string, StatusDefinition>;

export type ComponentStatus = keyof typeof componentStatuses;

const TAG_PREFIX = 'status:';

const isComponentStatus = (value: string): value is ComponentStatus => Object.hasOwn(componentStatuses, value);

/** Finds the lifecycle status among a component's tags, written as `status:<name>`. */
export const findComponentStatus = (tags: readonly string[] = []): ComponentStatus | undefined =>
	tags.map((tag) => (tag.startsWith(TAG_PREFIX) ? tag.slice(TAG_PREFIX.length) : '')).find(isComponentStatus);

const colorVariable = (componentStatus: ComponentStatus, property: keyof Colors) => `--rcx-storybook-status-${componentStatus}-${property}`;

/** Publishes the badge colors of a palette as CSS variables, so badges already on screen follow theme changes. */
export const applyComponentStatusColors = (element: HTMLElement, mode: Mode): void => {
	for (const [componentStatus, { colors }] of Object.entries(componentStatuses) as [ComponentStatus, StatusDefinition][]) {
		for (const [property, value] of Object.entries(colors(mode)) as [keyof Colors, string][]) {
			element.style.setProperty(colorVariable(componentStatus, property), value);
		}
	}
};

/** Styles a status badge like a Fuselage `Tag`, in the colors of a given palette or, without one, of the published CSS variables. */
export const getComponentStatusBadgeStyle = (componentStatus: ComponentStatus, mode?: Mode): CSSProperties => ({
	display: 'inline-block',
	flexShrink: 0,
	padding: '0 4px',
	borderRadius: border.radius.medium,
	fontSize: 12,
	fontWeight: 700,
	lineHeight: '16px',
	whiteSpace: 'nowrap',
	...(mode
		? componentStatuses[componentStatus].colors(mode)
		: {
				color: `var(${colorVariable(componentStatus, 'color')})`,
				backgroundColor: `var(${colorVariable(componentStatus, 'backgroundColor')})`,
			}),
});
