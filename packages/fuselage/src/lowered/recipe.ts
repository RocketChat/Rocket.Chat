import { createElement, isValidElement, type ReactElement, type ReactNode } from 'react';

/**
 * What `lowerStyled` computed from one `styled()` definition with Tamagui at build time. Style keys (`prop|state` for a
 * per-state value) are numbered, and each value is an index into its key's own values; a style is a flat list of key and
 * value pairs. Each slot is one of Tamagui's atomic class groups; its class depends on the keys set in it, their order and
 * whether a default or a caller set them, so the recipe tracks exactly that and looks the class up in a table Tamagui
 * filled at build time.
 */
export type Recipe = {
	name?: string;
	tag: string;
	defaults: [string, unknown][];
	/** Base values of the keys in slots a variant touches. */
	base: number[];
	/** Host class and the classes of the slots no variant touches. */
	baseClass: string;
	variants: Record<string, Record<string, number>>;
	entries: [style: number[], className: string][];
	/** The slot of each key. */
	slotOf: number[];
	slots: Record<string, string>[];
	/** A caller's variants apply in declaration order, not prop order. */
	ordered?: boolean;
	/** Computed variants, whose props are dropped. */
	dropped?: string[];
};

type Props = Record<string, unknown> & { children?: ReactNode };

/** The key of each touched slot for these props: the keys set in it, in Tamagui's order, with value and layer. */
export const slotTuples = (recipe: Recipe, props: Props) => {
	const merged: Props = {};
	for (const [key, value] of recipe.defaults) merged[key] = value;
	for (const key in props) {
		const value = props[key];
		if (value === undefined && key in merged) continue;
		merged[key] = value;
	}

	const { render = recipe.tag, className, style, ...rest } = merged;
	// A key set again moves to the end of its slot, as in Tamagui; a `Map` keeps that order for numeric keys
	const values = new Map<number, string>();
	for (let i = 0; i < recipe.base.length; i += 2) values.set(recipe.base[i], String(recipe.base[i + 1]));
	const dom: Props = {};
	let variantClass = '';

	const keys = Object.keys(rest);
	if (recipe.ordered) {
		const order = Object.keys(recipe.variants);
		const rank = (key: string) => (key in recipe.variants && !recipe.defaults.some(([name]) => name === key) ? order.indexOf(key) : -1);
		keys.sort((a, b) => rank(a) - rank(b));
	}
	for (const key of keys) {
		const domain = recipe.variants[key];
		if (domain) {
			const entry = recipe.entries[domain[String(rest[key])]];
			if (!entry) continue;
			const [set, entryClass] = entry;
			// A variant a default names stays in Tamagui's base layer, even with a caller's value
			const layer = recipe.defaults.some(([name]) => name === key) ? '' : '^';
			for (let i = 0; i < set.length; i += 2) {
				values.delete(set[i]);
				values.set(set[i], `${set[i + 1]}${layer}`);
			}
			if (entryClass) variantClass += ` ${entryClass}`;
		} else if (recipe.dropped?.includes(key)) {
			continue;
		} else {
			dom[key] = rest[key];
		}
	}

	const tuples = recipe.slots.map(() => '');
	for (const [key, value] of values) tuples[recipe.slotOf[key]] += `${key}=${value};`;
	return { tuples, render, className, style, variantClass, dom };
};

/** The class names Tamagui gives the frame for these props, without running Tamagui. */
export const resolveRecipe = (recipe: Recipe, props: Props) => {
	const { tuples, render, className, style, variantClass, dom } = slotTuples(recipe, props);
	let classes = recipe.baseClass;
	for (let i = 0; i < tuples.length; i++) if (recipe.slots[i][tuples[i]]) classes += ` ${recipe.slots[i][tuples[i]]}`;

	return {
		render: render as string | ReactElement,
		className: `${classes}${variantClass}${className ? ` ${className}` : ''}`,
		style: style as object | undefined,
		dom,
	};
};

/** A component that renders what a lowered `styled()` definition rendered, mapping props to its prebuilt classes. */
export const lowered = (recipe: Recipe) => {
	const Lowered = ({ children, ...props }: Props) => {
		const { render, className, style, dom } = resolveRecipe(recipe, props);
		if (isValidElement<Props>(render)) {
			return createElement(render.type, { ...render.props, ...dom, className, style }, children);
		}
		return createElement(render as string, { ...dom, className, style }, children);
	};
	Lowered.displayName = recipe.name;
	Lowered.isLoweredFrame = true;
	return Lowered;
};
