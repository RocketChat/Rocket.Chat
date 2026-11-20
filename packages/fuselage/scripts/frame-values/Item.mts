import { join } from 'node:path';

import { literal, type Value } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults, viewDefaults } from './lib/textFrameDefaults.mts';
import { fontScale, fraction, offScale, percent, radius, size, space, themed, zIndex } from './lib/tokens.mts';
import { webDefaults } from './lib/webDefaults.mts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Item', file);

const constant = (name: string, value: Value) => `const ${name} = ${literal(value)} as const;`;

// Each property of a frame is a class on every element it renders, and a list renders hundreds: a frame states only what
// differs from the base it extends, so the styles an element needs do not cost a rule it already gets from the View
const viewFrame = (style: Record<string, Value>) =>
	Object.fromEntries(
		Object.entries(webDefaults(style)).filter(([property, value]) => property === 'render' || viewDefaults[property] !== value),
	);

// What a Text frame leaves out: the flex properties of a box that is not a flex container, and the initial flex basis
const textFrame = (style: Record<string, Value>) => {
	const frame = webDefaults(style);
	const merged = { ...textFrameDefaults(frame), ...frame };
	const container = merged.display !== 'block' && merged.display !== 'inline';
	return Object.fromEntries(
		Object.entries(merged).filter(
			([property, value]) =>
				!(property === 'flexBasis' && value === 'auto') && (container || (property !== 'flexDirection' && property !== 'alignItems')),
		),
	);
};

// The width of the list a row is in, which `ItemGroup` names
const narrow = '@narrow/rcx-item-group';

// The row's hover and the focus it holds, which its parts follow; where nothing hovers they behave as hovered
const revealed = (hidden: Value, shown: Value) => ({
	'default': hidden,
	'group-hover/item': shown,
	'group-focus-within/item': shown,
	'hoverNone': shown,
});

const medium = offScale(2);
const thin = offScale(1);

const focusRing = {
	outlineWidth: medium,
	outlineStyle: 'solid',
	// Forced colors drop the box-shadow and paint the transparent outline instead
	outlineColor: 'transparent',
	outlineOffset: -medium,
	boxShadow: `inset 0 0 0 ${medium}px ${themed('stroke-highlight')}`,
};

const whenFocusVisible = (style: Record<string, Value>) =>
	Object.fromEntries(Object.entries(style).map(([property, value]) => [property, { 'focus-visible': value }]));

// What a row and a group show while a drag moves rows over them
const dropRings = {
	dropActive: { borderRadius: radius('medium'), boxShadow: focusRing.boxShadow },
	dropAvailable: {
		borderRadius: radius('medium'),
		outlineWidth: thin,
		outlineStyle: 'dashed',
		outlineColor: themed('stroke-highlight'),
		outlineOffset: -thin,
	},
};

const dropPaints = {
	dropActive: { backgroundColor: themed('status-background-info') },
	dropDisabled: { backgroundColor: 'transparent' },
};

// The edge padding of a row with its inset on top; the widest inset gives way in a narrow list
const edges = {
	none: space('x4'),
	sm: space('x8'),
	md: space('x12'),
	lg: { default: space('x24'), [narrow]: space('x16') },
};

const insets = (property: string, values: Record<string, Value>) =>
	Object.fromEntries(Object.entries(values).map(([inset, value]) => [inset, { [property]: value }]));

const generateItem = () => {
	const frame = viewFrame({
		render: 'div',
		position: 'relative',
		display: 'flex',
		alignItems: 'center',
		minWidth: 0,
		margin: 0,
		paddingBlock: { default: space('x4'), pointerCoarse: space('x8') },
		listStyle: 'none',
		textAlign: 'start',
		textDecorationLine: 'none',
		color: themed('font-default'),
		borderRadius: radius('small'),
		...fontScale('p2'),
	});

	const tones = {
		default: {},
		danger: { color: themed('status-font-on-danger') },
		success: { color: themed('status-font-on-success') },
		warning: { color: themed('status-font-on-warning') },
		disabled: { color: themed('font-disabled') },
		editing: { color: themed('status-font-on-warning-2') },
	};

	// One owner of the background: the first state that applies wins, in the order the stylesheet gave them
	const paints = {
		editing: { backgroundColor: themed('status-background-warning-2') },
		disabled: { backgroundColor: 'transparent' },
		selected: { backgroundColor: themed('surface-selected') },
		focused: { backgroundColor: themed('surface-hover') },
		...dropPaints,
		hover: { backgroundColor: { hover: themed('surface-hover') } },
	};

	const cursors = { 'pointer': { cursor: 'pointer' }, 'grab': { cursor: 'grab' }, 'not-allowed': { cursor: 'not-allowed' } };

	// The platform's focus ring, a ring a script drives, or what a drag shows on a row it could drop into
	const rings = {
		'native': whenFocusVisible(focusRing),
		'managed': { outlineStyle: { focus: 'none' }, outlineWidth: { focus: 0 } },
		'managed-visible': {
			...focusRing,
			outlineWidth: { default: medium, focus: 0 },
			outlineStyle: { default: 'solid', focus: 'none' },
		},
		...dropRings,
	};

	return [
		constant('itemFrame', frame),
		constant('itemInsets', insets('paddingInline', edges)),
		constant('itemGutters', { narrow: { gap: space('x4') }, wide: { gap: space('x8') } }),
		constant('itemTones', tones),
		constant('itemPaints', paints),
		constant('itemCursors', cursors),
		constant('itemRings', rings),
	].join('\n\n');
};

const generateItemGroup = () => {
	const frame = viewFrame({
		render: 'div',
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'normal',
		margin: 0,
		padding: 0,
		listStyle: 'none',
		containerName: 'rcx-item-group',
		containerType: 'inline-size',
	});

	return [
		constant('itemGroupFrame', frame),
		constant('itemGroupPaints', dropPaints),
		constant('itemGroupRings', dropRings),
		constant('itemGroupPositioned', { position: 'relative' }),
		constant('itemGroupHidden', { display: 'none' }),
	].join('\n\n');
};

const generateItemGroupHeader = () => {
	const frame = viewFrame({
		render: 'div',
		position: 'relative',
		display: 'flex',
		alignItems: 'center',
		minWidth: 0,
		minHeight: size('x28'),
		margin: 0,
		paddingBlock: space('x4'),
		listStyle: 'none',
		color: themed('font-secondary-info'),
		borderRadius: radius('small'),
		gap: space('x4'),
		...fontScale('c2'),
	});

	const sticky = { position: 'sticky', zIndex: zIndex('overlap'), top: 0 };

	const surfaces = {
		'sticky': { ...sticky, backgroundColor: themed('surface-light') },
		'interactive': { backgroundColor: { hover: themed('surface-hover') } },
		'sticky-interactive': { ...sticky, backgroundColor: { default: themed('surface-light'), hover: themed('surface-hover') } },
	};

	return [
		constant('itemGroupHeaderFrame', frame),
		constant('itemGroupHeaderInsets', insets('paddingInline', edges)),
		constant('itemGroupHeaderSurfaces', surfaces),
	].join('\n\n');
};

const generateItemContent = () =>
	constant(
		'itemContentFrame',
		viewFrame({
			render: 'div',
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'normal',
			flexGrow: 1,
			flexShrink: 1,
			flexBasis: 'auto',
			minWidth: 0,
		}),
	);

const generateItemRow = () =>
	constant('itemRowFrame', viewFrame({ render: 'div', display: 'flex', alignItems: 'center', minWidth: 0, gap: space('x4') }));

const slot = {
	render: 'div',
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'center',
	flexGrow: 0,
	flexShrink: 0,
	flexBasis: 'auto',
};

const iconBox = { width: size('x20'), height: size('x20') };
const atLeastIconBox = { minWidth: size('x20'), minHeight: size('x20') };

// The emphasis of a highlighted row changes the weight of whatever step of the type scale a part is on
const highlighted = { color: themed('font-titles-labels'), fontWeight: '500' };

const generateItemMedia = () =>
	[constant('itemMediaFrame', viewFrame(slot)), constant('itemMediaVariants', { default: {}, icon: iconBox, slot: atLeastIconBox })].join(
		'\n\n',
	);

const generateItemIcon = () =>
	[constant('itemIconFrame', viewFrame({ ...slot, ...iconBox })), constant('itemIconHighlighted', highlighted)].join('\n\n');

// What a part rendered as a button, as a link or a group title is, reads from the row: the browser gives it its own font
const inheritedFont = {
	fontVariantNumeric: 'inherit',
	fontFamily: 'inherit',
	fontSize: 'inherit',
	fontWeight: 'inherit',
	lineHeight: 'inherit',
	letterSpacing: 'inherit',
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
		constant('itemTitleFrame', textFrame({ render: 'div', ...truncating })),
		constant('itemTitleVariants', { wrap: { true: wrapping }, highlighted: { true: highlighted } }),
	].join('\n\n');

const generateItemDescription = () => {
	const frame = textFrame({
		render: 'div',
		display: 'block',
		...truncating,
		color: themed('font-secondary-info'),
		...fontScale('c1'),
	});

	return [
		constant('itemDescriptionFrame', frame),
		constant('itemDescriptionVariants', {
			wrap: { true: wrapping },
			// One owner of the size and the weight: the highlighted weight wins over the large size's
			scale: { 'large': fontScale('p2'), highlighted, 'large-highlighted': { ...fontScale('p2'), ...highlighted } },
			// After the title on its line, and on a line of its own where the list is narrow
			layout: {
				span: { display: 'inline' },
				inline: {
					display: { default: 'inline', [narrow]: 'block' },
					marginInlineStart: { default: space('x4'), [narrow]: 0 },
				},
			},
		}),
	].join('\n\n');
};

const generateItemMeta = () => {
	const frame = textFrame({
		render: 'div',
		display: 'block',
		flexGrow: 0,
		flexShrink: 0,
		flexBasis: 'auto',
		whiteSpace: 'nowrap',
		color: themed('font-secondary-info'),
		...fontScale('c1'),
	});

	return [
		constant('itemMetaFrame', frame),
		constant('itemMetaVariants', {
			truncate: { true: { overflow: 'hidden', flexShrink: 1, minWidth: 0, textOverflow: 'ellipsis' } },
			highlighted: { true: highlighted },
		}),
	].join('\n\n');
};

// A `button` or an `a` with nothing of its own but its text, which a group title that collapses its group is too
const bare = {
	padding: 0,
	cursor: 'pointer',
	textAlign: 'start',
	borderWidth: 0,
	borderStyle: 'none',
	borderColor: 'currentcolor',
	outlineWidth: 0,
	outlineStyle: 'none',
	backgroundColor: 'transparent',
};

const generateItemLink = () =>
	constant(
		'itemLinkFrame',
		textFrame({
			render: 'a',
			display: 'block',
			overflow: 'hidden',
			width: percent(100),
			margin: 0,
			...bare,
			whiteSpace: 'nowrap',
			textDecorationLine: 'none',
			textOverflow: 'ellipsis',
			color: 'inherit',
			...inheritedFont,
		}),
	);

const generateItemActions = () => {
	const actions = {
		render: 'div',
		position: 'relative',
		zIndex: zIndex('raised'),
		alignItems: 'center',
		flexGrow: 0,
		flexShrink: 0,
		flexBasis: 'auto',
		gap: offScale(2),
	};

	// Hidden actions take no room: a grid track that closes, and the gap in front of them pulled in
	const hover = viewFrame({
		...actions,
		display: 'grid',
		opacity: revealed(0, 1),
		gridTemplateColumns: revealed(fraction(0), fraction(1)),
	});

	// One owner of the margin: the gap of the row, the gap of a line or a header, none away from the row's slots, and
	// none while the menu the actions hold is open, which also keeps them shown
	const reveals = {
		narrow: { marginInlineStart: revealed(offScale(-4), 0) },
		wide: { marginInlineStart: revealed(offScale(-8), 0) },
		detached: { marginInlineStart: 0 },
		open: { opacity: 1, gridTemplateColumns: fraction(1), marginInlineStart: 0 },
	};

	return [
		constant('itemActionsFrame', viewFrame({ ...actions, display: 'flex' })),
		constant('itemActionsHoverFrame', hover),
		constant('itemActionsReveals', reveals),
		constant('itemActionsEnd', { justifyContent: 'flex-end', ...atLeastIconBox }),
		// The actions on a line overhang it instead of growing it
		constant('itemActionsOverhang', { alignContent: 'center', height: 0 }),
		constant(
			'itemActionsInner',
			viewFrame({
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
	const frame = viewFrame({
		render: 'div',
		display: 'block',
		margin: 0,
		paddingBlock: space('x4'),
		paddingInline: 0,
		listStyle: 'none',
		borderWidth: 0,
		borderStyle: 'none',
		borderColor: 'currentcolor',
	});

	const { none: _none, ...inset } = edges;

	return [constant('itemDividerFrame', frame), constant('itemDividerInsets', insets('marginInline', inset))].join('\n\n');
};

const generateItemDragHandle = () => {
	const frame = viewFrame({
		render: 'span',
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		flexGrow: 0,
		flexShrink: 0,
		flexBasis: 'auto',
		width: size('x16'),
		height: size('x20'),
		touchAction: 'none',
		cursor: { default: 'grab', press: 'grabbing' },
		color: { 'default': themed('font-secondary-info'), 'group-hover/item': themed('font-titles-labels') },
	});

	return [
		constant('itemDragHandleFrame', frame),
		constant('itemDragHandleLooks', {
			dragging: { cursor: 'grabbing' },
			disabled: {
				cursor: 'not-allowed',
				color: { 'default': themed('font-disabled'), 'group-hover/item': themed('font-disabled') },
			},
		}),
	].join('\n\n');
};

const generateItemDropSlot = () => {
	const frame = textFrame({
		render: 'div',
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		minHeight: size('x28'),
		margin: 0,
		padding: space('x4'),
		listStyle: 'none',
		color: themed('font-secondary-info'),
		borderWidth: thin,
		borderStyle: 'dashed',
		borderColor: themed('stroke-light'),
		borderRadius: radius('small'),
		...fontScale('c1'),
	});

	return [
		constant('itemDropSlotFrame', frame),
		constant('itemDropSlotTargets', {
			available: { borderColor: themed('stroke-highlight') },
			active: {
				color: themed('font-titles-labels'),
				borderStyle: 'solid',
				borderColor: themed('stroke-highlight'),
				backgroundColor: themed('status-background-info'),
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

	return [
		constant('itemGroupTitleFrame', frame),
		constant('itemGroupTitleButton', { display: 'flex', alignItems: 'center', ...bare, gap: space('x4') }),
	].join('\n\n');
};

export default [
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
] satisfies Target[];
