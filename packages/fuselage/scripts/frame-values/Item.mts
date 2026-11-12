import { join } from 'node:path';

import { elevation } from './lib/elevation.mts';
import { font, statusFont, themed } from './lib/frameTokens.mts';
import { highlighted, inheritedFont, itemContentBase, itemMediaBase, itemMetaBase, itemRowBase, textFrame } from './lib/itemFrames.mts';
import { itemCustomProperties, itemPalettes } from './lib/itemPalettes.mts';
import { literal, type Value } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { offScale, zIndex, zIndexAbove } from './lib/tokens.mts';
import { webDefaults } from './lib/webDefaults.mts';
import { borderRadius, borderWidth, fontColor, fontFamily, size, spacing, strokeColor } from '../../src/styleTokens.ts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Item', file);

const palettes = itemPalettes();

const constant = (name: string, value: Value) => `const ${name} = ${literal(value)} as const;`;

const focusRing = (width: string) => ({
	outlineWidth: width,
	outlineStyle: 'solid',
	outlineColor: 'transparent',
	outlineOffset: `calc(-1 * ${width})`,
	boxShadow: `inset 0 0 0 ${width} ${palettes.stroke.focus}`,
});

const medium = borderWidth('medium');
const thin = borderWidth('default');

// What a row, a group and a header share while a drag moves rows over them
const dropRing = {
	dropActive: { borderRadius: borderRadius('medium'), boxShadow: `inset 0 0 0 ${medium} ${palettes.stroke.focus}` },
	dropAvailable: {
		borderRadius: borderRadius('medium'),
		outlineWidth: thin,
		outlineStyle: 'dashed',
		outlineColor: palettes.stroke.focus,
		outlineOffset: `calc(-1 * ${thin})`,
	},
};

const linkColor = themed('sidebar-link-color', fontColor('titles-labels'));

const generateItem = () => {
	const frame = webDefaults({
		render: 'div',
		position: 'relative',
		display: 'flex',
		alignItems: 'center',
		minWidth: 0,
		margin: 0,
		paddingBlock: { default: spacing('x4')!, pointerCoarse: spacing('x8')! },
		paddingInline: `calc(${spacing('x4')} + var(--rcx-item-inset-inline))`,
		textAlign: 'start',
		textDecorationLine: 'none',
		color: palettes.font.default,
		borderRadius: borderRadius('small'),
		fontFamily: fontFamily('sans'),
		gap: 'var(--rcx-item-gap)',
		...font('p2'),
	});

	const tones = {
		default: {},
		danger: { color: palettes.font.danger },
		success: { color: themed('option-color-variant-success', statusFont('success')) },
		warning: { color: themed('option-color-variant-warning', statusFont('warning')) },
		// There is no such status color: the variable stays undefined, as on develop, and the row keeps the color it inherits
		primary: { color: 'var(--rcx-option-color-variant-primary, var(--rcx-color-status-font-on-primary))' },
		disabled: { color: palettes.font.disabled },
		// The color of a link row: a theme hook, then the sidebar's; no `:visited` key exists, so a visited link keeps it
		link: {
			color: {
				'default': themed('link-color', linkColor),
				'focus': themed('link-focus-color', linkColor),
				'focus-within': themed('link-focus-color', linkColor),
			},
		},
	};

	// One owner of the background: the first state that applies wins, as the stylesheet's order made it
	const paints = {
		dropActive: { backgroundColor: palettes.surface.dropTarget },
		dropDisabled: { backgroundColor: 'transparent' },
		disabled: { backgroundColor: 'transparent' },
		selected: { backgroundColor: palettes.surface.selected },
		// A list of options that the pointer is over hides the cursor's row, unless the pointer is on that row
		focused: {
			backgroundColor: { 'default': palettes.surface.hover, 'group-hover/options': 'transparent', 'hover': palettes.surface.hover },
		},
		hover: { backgroundColor: { hover: palettes.surface.hover } },
	};

	const cursors = { 'pointer': { cursor: 'pointer' }, 'grab': { cursor: 'grab' }, 'not-allowed': { cursor: 'not-allowed' } };

	// The browser's focus ring, a ring a script drives, or what a drag shows on a row it could drop into
	const ring = {
		'native': {
			outlineWidth: { 'focus-visible': medium },
			outlineStyle: { 'focus-visible': 'solid' },
			outlineColor: { 'focus-visible': 'transparent' },
			outlineOffset: { 'focus-visible': `calc(-1 * ${medium})` },
			boxShadow: { 'focus-visible': focusRing(medium).boxShadow },
		},
		'managed': { outlineStyle: { focus: 'none' }, outlineWidth: { focus: 0 } },
		'managed-visible': {
			outlineWidth: { default: medium, focus: 0 },
			outlineStyle: { default: 'solid', focus: 'none' },
			outlineColor: 'transparent',
			outlineOffset: `calc(-1 * ${medium})`,
			boxShadow: focusRing(medium).boxShadow,
		},
		...dropRing,
	};

	return [
		constant('itemFrame', frame),
		constant('itemTones', tones),
		constant('itemPaints', paints),
		constant('itemCursors', cursors),
		constant('itemRings', ring),
		constant('itemMultiline', { flexWrap: 'wrap' }),
		constant('itemDensities', { large: { paddingBlock: spacing('x8')! } }),
	].join('\n\n');
};

const generateItemGroup = () => {
	const frame = webDefaults({
		render: 'div',
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'normal',
		margin: 0,
		padding: 0,
	});

	return [
		constant('itemGroupFrame', frame),
		constant('itemGroupPaints', {
			dropActive: { backgroundColor: palettes.surface.dropTarget },
			dropDisabled: { backgroundColor: 'transparent' },
		}),
		constant('itemGroupRings', dropRing),
		constant('itemGroupPositioned', { position: 'relative' }),
		constant('itemGroupHidden', { display: 'none' }),
		constant('itemGroupDensities', { large: { paddingBlock: spacing('x8')! } }),
	].join('\n\n');
};

const generateItemGroupHeader = () => {
	const frame = webDefaults({
		render: 'div',
		position: 'relative',
		display: 'flex',
		alignItems: 'center',
		minWidth: 0,
		minHeight: size('x28')!,
		margin: 0,
		paddingBlock: spacing('x4')!,
		paddingInline: `calc(${spacing('x4')} + var(--rcx-item-inset-inline))`,
		color: palettes.font.secondary,
		borderRadius: borderRadius('small'),
		fontFamily: fontFamily('sans'),
		gap: 'var(--rcx-item-gap)',
		...font('c2'),
	});

	const sticky = { position: 'sticky', zIndex: zIndex.sticky, top: 0 };

	const surfaces = {
		'sticky': { ...sticky, backgroundColor: palettes.surface.groupHeader },
		'interactive': { backgroundColor: { hover: palettes.surface.hover } },
		'sticky-interactive': { ...sticky, backgroundColor: { default: palettes.surface.groupHeader, hover: palettes.surface.hover } },
	};

	return [
		constant('itemGroupHeaderFrame', frame),
		constant('itemGroupHeaderSurfaces', surfaces),
		constant('itemGroupHeaderDensities', { large: { paddingBlock: spacing('x8')! } }),
	].join('\n\n');
};

const generateItemContent = () => constant('itemContentFrame', itemContentBase);

const generateItemRow = () => [constant('itemRowFrame', itemRowBase)].join('\n\n');

const generateItemMedia = () => {
	return [
		constant('itemMediaFrame', itemMediaBase),
		constant('itemMediaVariants', {
			default: {},
			icon: { width: size('x20')!, height: size('x20')! },
			slot: { minWidth: size('x20')!, minHeight: size('x20')! },
		}),
	].join('\n\n');
};

const generateItemIcon = () => {
	const frame = webDefaults({
		render: 'div',
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		flexGrow: 0,
		flexShrink: 0,
		flexBasis: 'auto',
		width: size('x20')!,
		height: size('x20')!,
	});

	return [constant('itemIconFrame', frame), constant('itemIconHighlighted', { color: palettes.font.highlighted, fontWeight: 500 })].join(
		'\n\n',
	);
};

const truncating = {
	overflow: 'hidden',
	flexGrow: 1,
	flexShrink: 1,
	flexBasis: 'auto',
	minWidth: 0,
	whiteSpace: 'nowrap',
	textOverflow: 'ellipsis',
};

const wrapping = { overflow: 'visible', whiteSpace: 'normal', overflowWrap: 'anywhere' };

const generateItemTitle = () =>
	[
		constant('itemTitleFrame', textFrame({ render: 'div', ...truncating, ...inheritedFont })),
		constant('itemTitleVariants', { wrap: { true: wrapping }, highlighted: { true: highlighted } }),
	].join('\n\n');

const generateItemDescription = () => {
	const frame = textFrame({
		render: 'div',
		display: 'block',
		...truncating,
		color: palettes.font.secondary,
		...inheritedFont,
		...font('c1'),
	});

	return [
		constant('itemDescriptionFrame', frame),
		constant('itemDescriptionVariants', {
			wrap: { true: wrapping },
			// One owner of the size and the weight: the highlighted weight wins over the large size's
			scale: { 'large': font('p2'), highlighted, 'large-highlighted': { ...font('p2'), ...highlighted } },
			// Takes the room the row leaves, so the description never pushes a sibling that must keep its width
			fill: { true: { flexBasis: 0 } },
			// The narrow rule of the stylesheet sets these two inputs back to a block with no margin
			layout: {
				span: { display: 'inline' },
				inline: {
					display: 'var(--rcx-item-description-display, inline)',
					marginInlineStart: `var(--rcx-item-description-margin, ${spacing('x4')})`,
				},
			},
		}),
	].join('\n\n');
};

const generateItemMeta = () => {
	return [
		constant('itemMetaFrame', itemMetaBase),
		constant('itemMetaVariants', {
			truncate: { true: { overflow: 'hidden', flexShrink: 1, minWidth: 0, textOverflow: 'ellipsis' } },
			highlighted: { true: highlighted },
		}),
	].join('\n\n');
};

const generateItemLink = () => {
	const frame = textFrame({
		render: 'a',
		display: 'block',
		overflow: 'hidden',
		width: '100%',
		margin: 0,
		padding: 0,
		cursor: 'pointer',
		textAlign: 'start',
		whiteSpace: 'nowrap',
		textDecorationLine: 'none',
		textOverflow: 'ellipsis',
		color: 'inherit',
		borderWidth: 0,
		borderStyle: 'none',
		borderColor: 'currentcolor',
		outlineWidth: 0,
		outlineStyle: 'none',
		backgroundColor: 'transparent',
		...inheritedFont,
	});

	return constant('itemLinkFrame', frame);
};

const generateItemActions = () => {
	const frame = webDefaults({
		render: 'div',
		position: 'relative',
		zIndex: zIndex.raised,
		display: 'flex',
		alignItems: 'center',
		flexGrow: 0,
		flexShrink: 0,
		flexBasis: 'auto',
		gap: offScale(2),
	});

	const gap = 'calc(var(--rcx-item-gap) * -1)';

	// Hidden until the row is hovered or holds focus, until a touch screen has no hover, or while the menu it holds is open.
	// The group keys sit at the base of this frame, never inside a variant, so a variant that restates a property only moves its default.
	const hover = webDefaults({
		render: 'div',
		position: 'relative',
		zIndex: zIndex.raised,
		display: 'grid',
		alignItems: 'center',
		flexGrow: 0,
		flexShrink: 0,
		flexBasis: 'auto',
		gap: offScale(2),
		opacity: { 'default': 0, 'group-hover/item': 1, 'group-focus-within/item': 1, 'hoverNone': 1 },
		gridTemplateColumns: { 'default': '0fr', 'group-hover/item': '1fr', 'group-focus-within/item': '1fr', 'hoverNone': '1fr' },
		marginInlineStart: { 'default': gap, 'group-hover/item': 0, 'group-focus-within/item': 0, 'hoverNone': 0 },
	});

	// While the menu it holds is open the actions stay shown
	const pinned = { opacity: 1, gridTemplateColumns: '1fr', marginInlineStart: 0 };

	// Hidden actions that are not a direct child of the row do not pull in their margin
	const detached = { marginInlineStart: 0 };

	// Lines of a row keep their height while the actions overhang it
	const overhang = { alignContent: 'center', height: 0 };

	return [
		constant('itemActionsFrame', frame),
		constant('itemActionsHoverFrame', hover),
		constant('itemActionsPinned', pinned),
		constant('itemActionsDetached', detached),
		constant('itemActionsOverhang', overhang),
		constant('itemActionsEnd', { justifyContent: 'flex-end', minWidth: size('x20')!, minHeight: size('x20')! }),
		constant(
			'itemActionsInner',
			webDefaults({
				render: 'div',
				display: 'flex',
				alignItems: 'center',
				overflow: { 'default': 'hidden', 'group-focus-within/item': 'visible' },
				minWidth: 0,
				gap: offScale(2),
			}),
		),
	].join('\n\n');
};

const generateItemDivider = () => {
	const frame = webDefaults({
		render: 'div',
		display: 'block',
		margin: 0,
		paddingBlock: spacing('x4')!,
		paddingInline: 0,
		borderWidth: 0,
		borderStyle: 'none',
		borderColor: 'currentcolor',
	});

	return [
		constant('itemDividerFrame', frame),
		constant('itemDividerInsets', {
			sm: { marginInline: `calc(${spacing('x4')} + var(--rcx-item-inset-inline))` },
			md: { marginInline: `calc(${spacing('x4')} + var(--rcx-item-inset-inline))` },
			lg: { marginInline: `calc(${spacing('x4')} + var(--rcx-item-inset-inline))` },
		}),
	].join('\n\n');
};

const generateItemDragHandle = () => {
	const frame = webDefaults({
		render: 'span',
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		flexGrow: 0,
		flexShrink: 0,
		flexBasis: 'auto',
		width: size('x16')!,
		height: size('x20')!,
		touchAction: 'none',
		cursor: { default: 'grab', press: 'grabbing' },
		color: { 'default': palettes.font.secondary, 'group-hover/item': palettes.font.highlighted },
	});

	return [
		constant('itemDragHandleFrame', frame),
		// The grip follows its row's hover and the pointer down on it; a row that cannot move shows the grip as unavailable.
		// The hover color is a group key at the frame's base, so the one variant that restates the color is the disabled one
		constant('itemDragHandleLooks', {
			dragging: { cursor: 'grabbing' },
			disabled: { cursor: 'not-allowed', color: palettes.font.disabled },
		}),
	].join('\n\n');
};

const generateItemDropSlot = () => {
	const frame = textFrame({
		render: 'div',
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		minHeight: size('x28')!,
		margin: 0,
		padding: spacing('x4')!,
		color: palettes.font.secondary,
		borderWidth: thin,
		borderStyle: 'dashed',
		borderColor: palettes.stroke.slot,
		borderRadius: borderRadius('small'),
		fontFamily: fontFamily('sans'),
		...font('c1'),
	});

	return [
		constant('itemDropSlotFrame', frame),
		constant('itemDropSlotTargets', {
			available: { borderColor: palettes.stroke.focus },
			active: {
				color: palettes.font.highlighted,
				borderStyle: 'solid',
				borderColor: palettes.stroke.focus,
				backgroundColor: palettes.surface.dropTarget,
			},
		}),
	].join('\n\n');
};

const generateItemGroupTitle = () => {
	const frame = textFrame({
		render: 'div',
		display: 'block',
		overflow: 'hidden',
		flexGrow: 1,
		flexShrink: 1,
		flexBasis: 'auto',
		minWidth: 0,
		margin: 0,
		whiteSpace: 'nowrap',
		textOverflow: 'ellipsis',
		color: 'inherit',
		...inheritedFont,
	});

	// A collapse button: the whole header is its target, through its stretched `::after`
	const button = {
		display: 'flex',
		alignItems: 'center',
		padding: 0,
		cursor: 'pointer',
		textAlign: 'start',
		borderWidth: 0,
		borderStyle: 'none',
		borderColor: 'currentcolor',
		outlineWidth: 0,
		outlineStyle: 'none',
		backgroundColor: 'transparent',
		gap: spacing('x4')!,
	};

	// A title that is not a native button but acts as one: the focus ring is a border that turns highlight, not the `::after` of the button
	const { gap: _gap, ...buttonLayout } = button;
	const border = {
		...buttonLayout,
		columnGap: spacing('x4')!,
		flexBasis: 0,
		borderWidth: thin,
		borderStyle: 'solid',
		borderColor: {
			'default': 'transparent',
			'focus-visible': palettes.stroke.focus,
		},
		borderRadius: { 'focus-visible': borderRadius('medium') },
	};

	return [constant('itemGroupTitleFrame', frame), constant('itemGroupTitleLooks', { button, border })].join('\n\n');
};

const drag = (offset: number) => zIndexAbove('drag', offset);

// The rules a frame cannot express: custom properties its values read, pseudo-elements, keyframes, and what the drag
// hook creates by hand. Each touches only properties no frame sets.
const generateStyles = () => {
	const gap = spacing('x4')!;
	const flat = { ...palettes.stroke };
	const dividerLine = `${thin} solid ${flat.divider}`;
	const lightLine = themed('sidebar-color-stroke-extra-light', strokeColor('light'));
	const lineHeight = medium;
	const revealDuration = '0.18s';
	const stretched = `position: absolute;\n\tinset: 0;\n\n\tcontent: '';\n\n\tborder-radius: inherit;\n\n\tfont-variant-numeric: inherit;`;
	const ring = (selector: string) =>
		`${selector} {\n\toutline: ${medium} solid transparent;\n\toutline-offset: calc(-1 * ${medium});\n\n\tbox-shadow: inset 0 0 0 ${medium} ${palettes.stroke.focus};\n}`;
	const preview = elevation()['2'] as { boxShadow: string; borderWidth: string; borderStyle: string; borderColor: string };

	return `/* stylelint-disable length-zero-no-unit -- a unitless zero would make the calc() of the padding invalid */

/* Properties Tamagui has no key for: the list style of a part that renders an li */
.rcx-item,
.rcx-item-group,
.rcx-item-group-header,
.rcx-item-divider,
.rcx-item-drop-slot {
	list-style: none;
}

/* The width of a group drives its narrow layout */
.rcx-item-group {
	container: rcx-item-group / inline-size;
}

/* Component-scoped custom property inputs a frame value reads */
/* The header and the row start from the same inputs as an item, before the modifiers set them */
.rcx-item-group-header,
.rcx-item__row {
	--rcx-item-gap: ${gap};
}

.rcx-item-group-header {
	--rcx-item-inset-inline: 0px;
}

${itemCustomProperties({
	blocks: ['item', 'item-group-header', 'item-divider'],
	container: { name: 'rcx-item-group', narrowWidth: 320 },
})}

@container rcx-item-group (width < 320px) {
	.rcx-item__description--inline {
		--rcx-item-description-display: block;
		--rcx-item-description-margin: ${spacing('none')};
	}
}

/* Properties Tamagui has no key for: the transition of the actions that reveal on hover, between the values the frame sets */
.rcx-item__actions--reveal-hover {
	transition:
		grid-template-columns ${revealDuration} ease,
		margin-inline-start ${revealDuration} ease,
		opacity ${revealDuration} ease;
}

@media (prefers-reduced-motion: reduce) {
	.rcx-item__actions--reveal-hover {
		transition: none;
	}
}

/* Pseudo-elements on the part's own element: the stretched target of a link and of a collapse button */
.rcx-item__link::after,
button.rcx-item-group-title::after {
	${stretched}
}

${ring('.rcx-item__link:focus-visible::after,\nbutton.rcx-item-group-title:focus-visible::after')}

/* The divider line */
.rcx-item-divider::before {
	display: block;

	content: '';

	border-top: ${dividerLine};
}

/* The line of a divider on the sidebar's surface, under the custom property a theme overrides for it */
.rcx-item-divider--light::before {
	border-top-color: ${lightLine};
}

/* Keyframe animation: a row or a group that has just landed */
@keyframes rcx-item-dropped {
	from {
		background-color: ${palettes.surface.selected};
	}
}

.rcx-item--dropped,
.rcx-item-group--dropped {
	animation: rcx-item-dropped 0.6s ease-out;
}

@media (prefers-reduced-motion: reduce) {
	.rcx-item--dropped,
	.rcx-item-group--dropped {
		animation: none;
	}
}

/* Pseudo-elements on the part's own element: the line where a dragged row would land */
.rcx-item--drop-before::before,
.rcx-item--drop-after::before,
.rcx-item-group--drop-before::before,
.rcx-item-group--drop-after::before {
	position: absolute;
	z-index: ${zIndex.overlap};
	inset-inline: 0;

	height: ${lineHeight};

	content: '';

	pointer-events: none;

	border-radius: ${lineHeight};
	background-color: ${palettes.stroke.focus};
}

/* The line sits on the gap between two rows, so "after" one row and "before" the next draw the same line */
.rcx-item--drop-before::before,
.rcx-item-group--drop-before::before {
	top: calc(${lineHeight} / -2);
}

.rcx-item--drop-after::before,
.rcx-item-group--drop-after::before {
	bottom: calc(${lineHeight} / -2);
}

/* Forced colors drop backgrounds and box-shadows, so the drop line and target use system colors instead */
@media (forced-colors: active) {
	.rcx-item--drop-before::before,
	.rcx-item--drop-after::before,
	.rcx-item-group--drop-before::before,
	.rcx-item-group--drop-after::before,
	.rcx-item-drop-line {
		background-color: Highlight;
		forced-color-adjust: none;
	}

	.rcx-item-drop-box {
		outline: ${medium} solid Highlight;
		outline-offset: calc(-1 * ${medium});
	}
}

/* Elements created outside React: drawn over a list whose rows are not inside their group's element, such as a virtualized list */
.rcx-item-drop-line,
.rcx-item-drop-box {
	position: fixed;
	z-index: ${drag(4)};

	box-sizing: border-box;

	pointer-events: none;
}

.rcx-item-drop-line {
	height: ${lineHeight};
	margin-block-start: calc(${lineHeight} / -2);

	border-radius: ${lineHeight};
	background-color: ${palettes.stroke.focus};
}

.rcx-item-drop-box {
	border-radius: ${borderRadius('medium')};
	background-color: color-mix(in srgb, ${palettes.stroke.focus} 8%, transparent);
	box-shadow: inset 0 0 0 ${medium} ${palettes.stroke.focus};
}

.rcx-item-drop-box--available {
	z-index: ${drag(0)};

	outline: ${thin} dashed ${palettes.stroke.focus};
	outline-offset: calc(-1 * ${thin});

	background-color: transparent;
	box-shadow: none;
}

/* Tells assistive technologies where a row moved by keyboard landed */
.rcx-item-drag-announcer {
	position: absolute;

	overflow: hidden;
	clip: rect(0, 0, 0, 0);

	width: 1px;
	height: 1px;
	margin: ${offScale(-1)};
	padding: 0;

	white-space: nowrap;

	border: 0;
	clip-path: inset(50%);
}

/* Covers the page while a row is dragged, so nothing under the pointer reacts to it */
.rcx-item-drag-shield {
	position: fixed;
	z-index: ${drag(1)};
	inset: 0;

	cursor: grabbing;
}

.rcx-item-drag-shield--no-drop {
	cursor: no-drop;
}

/* The copy of a row or group header that follows the pointer while it is dragged */
.rcx-item-drag-preview {
	position: fixed;
	z-index: ${drag(3)};
	top: 0;
	left: 0;

	box-sizing: border-box;
	margin: 0;

	cursor: grabbing;
	pointer-events: none;

	opacity: 0.92;
	border: ${preview.borderWidth} ${preview.borderStyle} ${preview.borderColor};
	border-radius: ${borderRadius('small')};
	background-color: ${palettes.surface.dragPreview};
	box-shadow: ${preview.boxShadow};
}`;
};

const targets: Target[] = [
	{ file: component('Item.tsx'), generate: generateItem },
	{ file: component('ItemActions.tsx'), generate: generateItemActions },
	{ file: component('ItemContent.tsx'), generate: generateItemContent },
	{ file: component('ItemDescription.tsx'), generate: generateItemDescription },
	{ file: component('ItemDivider.tsx'), generate: generateItemDivider },
	{ file: component('ItemDragHandle.tsx'), generate: generateItemDragHandle },
	{ file: component('ItemDropSlot.tsx'), generate: generateItemDropSlot },
	{ file: component('ItemGroup.tsx'), generate: generateItemGroup },
	{ file: component('ItemGroupHeader.tsx'), generate: generateItemGroupHeader },
	{ file: component('ItemGroupTitle.tsx'), generate: generateItemGroupTitle },
	{ file: component('ItemIcon.tsx'), generate: generateItemIcon },
	{ file: component('ItemLink.tsx'), generate: generateItemLink },
	{ file: component('ItemMedia.tsx'), generate: generateItemMedia },
	{ file: component('ItemMeta.tsx'), generate: generateItemMeta },
	{ file: component('ItemRow.tsx'), generate: generateItemRow },
	{ file: component('ItemTitle.tsx'), generate: generateItemTitle },
	{ file: component('Item.styles.css'), generate: generateStyles, css: true },
];

export default targets;
