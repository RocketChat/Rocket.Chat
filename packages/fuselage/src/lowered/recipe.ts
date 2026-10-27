import { createElement, isValidElement, type ReactElement, type ReactNode } from 'react';

type StyleObject = Record<string, string | number>;

/**
 * What `lowerStyled` computed from one `styled()` definition with Tamagui at build time. Style values are indices into
 * the build's value pool, keyed by style prop (`prop|state` for a per-state value). Each slot is one of Tamagui's atomic
 * class groups; its class depends on the keys set in it, their order and whether a default or a caller set them, so the
 * recipe tracks exactly that and looks the class up in a table Tamagui filled at build time.
 */
export type Recipe = {
	name?: string;
	tag: string;
	defaults: [string, unknown][];
	/** Base values of the keys in slots a variant touches. */
	base: Record<string, number>;
	/** Host class and the classes of the slots no variant touches. */
	baseClass: string;
	variants: Record<string, Record<string, number>>;
	entries: [set: Record<string, number>, className: string][];
	slotOf: Record<string, number>;
	slots: Record<string, string>[];
	/** Style props a use-site may set directly; they go inline. */
	inline?: string[];
	/** A caller's variants apply in declaration order, not prop order. */
	ordered?: boolean;
	/** Computed variants, whose props are dropped. */
	dropped?: string[];
};

type Props = Record<string, unknown> & { children?: ReactNode };

// Short ids for the style keys, to keep the tables' keys small
const keyIds = new WeakMap<Recipe, Record<string, number>>();
const idsOf = (recipe: Recipe) => {
	let ids = keyIds.get(recipe);
	if (!ids) keyIds.set(recipe, (ids = Object.fromEntries(Object.keys(recipe.slotOf).map((key, i) => [key, i]))));
	return ids;
};

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
	const values: Record<string, string> = {};
	for (const key in recipe.base) values[key] = String(recipe.base[key]);
	const dom: Props = {};
	let variantClass = '';
	let inline: StyleObject | undefined;

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
			// A variant a default names stays in Tamagui's base layer, even with a caller's value
			const layer = recipe.defaults.some(([name]) => name === key) ? '' : '^';
			for (const k in entry[0]) {
				delete values[k];
				values[k] = `${entry[0][k]}${layer}`;
			}
			if (entry[1]) variantClass += ` ${entry[1]}`;
		} else if (recipe.dropped?.includes(key)) {
			continue;
		} else if (recipe.inline?.includes(key)) {
			(inline ??= {})[key] = rest[key] as string;
		} else {
			dom[key] = rest[key];
		}
	}

	const tuples = recipe.slots.map(() => '');
	const ids = idsOf(recipe);
	for (const key in values) tuples[recipe.slotOf[key]] += `${ids[key]}=${values[key]};`;
	return { tuples, render, className, style, inline, variantClass, dom };
};

/** The class names and inline style Tamagui gives the frame for these props, without running Tamagui. */
export const resolveRecipe = (recipe: Recipe, props: Props) => {
	const { tuples, render, className, style, inline, variantClass, dom } = slotTuples(recipe, props);
	let classes = recipe.baseClass;
	for (let i = 0; i < tuples.length; i++) if (recipe.slots[i][tuples[i]]) classes += ` ${recipe.slots[i][tuples[i]]}`;

	return {
		render: render as string | ReactElement,
		className: `${classes}${variantClass}${className ? ` ${className}` : ''}`,
		style: inline || style ? { ...inline, ...(style as object) } : undefined,
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
