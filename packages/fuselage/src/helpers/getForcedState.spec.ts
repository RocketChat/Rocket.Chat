import { getForcedState } from './getForcedState';

describe('getForcedState', () => {
	it.each([
		['rcx-button is-hovered', 'hover'],
		['rcx-button hover', 'hover'],
		['rcx-button is-active', 'press'],
		['rcx-button active', 'press'],
		['rcx-button is-focused', 'focus'],
		['rcx-button focus focus-visible', 'focusVisible'],
		['rcx-button', undefined],
		['rcx-button rcx-button--hover-like', undefined],
		[undefined, undefined],
	])('reads %p as %p', (className, expected) => {
		expect(getForcedState(className)).toBe(expected);
	});
});
