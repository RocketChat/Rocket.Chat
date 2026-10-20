/**
 * Declares `@layer reset, fuselage;` at the very start of the document. A layer's place is fixed by its first
 * appearance, and Tamagui inserts its `fuselage` sheet at runtime, which can come before a `reset` stylesheet that
 * JavaScript injects later (Storybook's style-loader does), letting element resets beat every frame. `fuselage.css`
 * repeats the statement for pages that load it first.
 */
if (typeof document !== 'undefined' && !document.getElementById('rcx-layer-order')) {
	const style = document.createElement('style');
	style.id = 'rcx-layer-order';
	style.textContent = '@layer reset, fuselage;';
	document.head.prepend(style);
}

export {};
