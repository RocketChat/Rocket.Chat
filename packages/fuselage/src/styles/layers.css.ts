import { globalLayer, globalStyle, style, type StyleRule } from '@vanilla-extract/css';

// Declared together so the order statement matches `index.css` wherever this CSS lands
globalLayer('reset');
export const fuselageLayer = globalLayer('fuselage');

/** Puts a rule in the `fuselage` cascade layer, below app CSS, css-in-js and admin custom CSS. */
export const layered = (rule: StyleRule): StyleRule => ({ '@layer': { [fuselageLayer]: rule } });

/** Hover only on devices that hover, so touch screens get no sticky hover. */
export const onHover = (rule: StyleRule, selector = '&:hover'): StyleRule => ({
	'@media': { '(hover: hover)': { selectors: { [selector]: rule } } },
});

/** The base a Tamagui `View` gets, at zero specificity like Tamagui's `:where(.is_View)`. */
export const view = style({});
globalStyle(`:where(${view})`, layered({
	display: 'flex',
	alignItems: 'stretch',
	flexDirection: 'column',
	flexBasis: 'auto',
	boxSizing: 'border-box',
	minHeight: 0,
	minWidth: 0,
	flexShrink: 0,
}));

/** The base a Tamagui `Text` gets. */
export const text = style({});
globalStyle(`:where(${text})`, layered({
	display: 'inline',
	boxSizing: 'border-box',
	wordWrap: 'break-word',
	whiteSpace: 'pre-wrap',
	margin: 0,
}));
globalStyle(`:where(${view}, ${text})`, layered({ WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' }));
// ponytail: Tamagui scopes this with `@scope (.is_Text) to (.is_View)`; the nested-text case is all the prototype needs
globalStyle(`:where(${text}) :where(${text})`, layered({ whiteSpace: 'inherit', wordWrap: 'inherit' }));
