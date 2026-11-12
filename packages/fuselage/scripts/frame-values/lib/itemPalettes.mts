import { statusFont } from './frameTokens.mts';
import { statusBackgroundColors } from '../../../src/Theme.ts';
import { toCSSValue } from '../../../src/helpers/toCSSValue.ts';
import { backgroundColor, fontColor, spacing, strokeColor } from '../../../src/styleTokens.ts';

const themed = (name: string, value: string) => toCSSValue(`--rcx-item-${name}`, value);

/** The colours of an Item and its parts, under the `--rcx-item-*` custom properties a theme can override. */
export const itemPalettes = () => ({
	font: {
		default: themed('color-font-default', fontColor('default')),
		highlighted: themed('color-font-highlighted', fontColor('titles-labels')),
		secondary: themed('color-font-secondary', fontColor('secondary-info')),
		disabled: themed('color-font-disabled', fontColor('disabled')),
		danger: themed('color-font-danger', statusFont('danger')),
	},
	surface: {
		hover: themed('color-surface-hover', backgroundColor('hover')),
		selected: themed('color-surface-selected', backgroundColor('selected')),
		groupHeader: themed('group-header-color-surface', backgroundColor('light')),
		dragPreview: themed('drag-preview-color-surface', backgroundColor('light')),
		dropTarget: themed('group-color-surface-drop-target', statusBackgroundColors['status-background-info'].toString()),
	},
	stroke: {
		focus: themed('color-stroke-focus', strokeColor('highlight')),
		divider: themed('color-stroke-divider', strokeColor('extra-light')),
		slot: themed('color-stroke-slot', strokeColor('light')),
	},
});

/** The `--rcx-item-inset-inline` each `inset` size sets, as the sizes of the spacing scale. */
export const itemInsets = { sm: 'x4', md: 'x8', lg: 'x20' } as const;

type ItemCustomProperties = {
	/** The BEM blocks that take an `--inset-*` modifier, as `item`. */
	blocks: string[];
	/** The container the narrow rule queries and its width limit, in pixels. */
	container: { name: string; narrowWidth: number };
};

/**
 * The inputs a frame value reads through `var()`: the inset and the gap of an Item, set per modifier class and under the
 * narrow container query. A frame can't set them, because Tamagui drops a custom property set inside a variant.
 */
export const itemCustomProperties = ({ blocks, container }: ItemCustomProperties) => {
	const [item] = blocks;
	const insetRules = blocks.flatMap((block) =>
		(Object.keys(itemInsets) as (keyof typeof itemInsets)[]).map(
			(size) => `.rcx-${block}--inset-${size} {\n\t--rcx-item-inset-inline: ${spacing(itemInsets[size])};\n}`,
		),
	);
	const narrow = blocks.map((block) => `\t.rcx-${block}--inset-lg`).join(',\n');

	return [
		`.rcx-${item} {\n\t--rcx-item-gap: ${spacing('x4')};\n\t--rcx-item-inset-inline: 0px;\n}`,
		`.rcx-${item}--multiline,\n.rcx-${item}:has(> .rcx-${item}__content > :nth-child(2)) {\n\t--rcx-item-gap: ${spacing('x8')};\n}`,
		...insetRules,
		`@container ${container.name} (width < ${container.narrowWidth}px) {\n${narrow} {\n\t\t--rcx-item-inset-inline: ${spacing('x12')};\n\t}\n}`,
	].join('\n\n');
};
