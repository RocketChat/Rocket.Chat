import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Linter } from 'eslint';

import rule from '../rules/render-element-spread.js';

const safeCalls = [
	'ariaAndDataAttributes',
	'customProperties',
	'pickPositionStyle',
	'pickWebAnimationHandlers',
	'pickWebPressHandlers',
	'pickWebRowHandlers',
	'pickWebTextInputHandlers',
];

const messagesFor = (code) =>
	new Linter()
		.verify(code, [
			{
				files: ['**/*.js'],
				languageOptions: { ecmaVersion: 'latest', sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } } },
				plugins: { rc: { rules: { 'render-element-spread': rule } } },
				rules: { 'rc/render-element-spread': ['error', { safeCalls }] },
			},
		])
		.map(({ message, fatal }) => (fatal ? `parse error: ${message}` : message));

const FRAME = 'const Frame = styled(View, {});\n';

test('allows safe calls spread on the render element', () => {
	const code = `${FRAME}const A = (props) => (
		<Frame render={<button {...ariaAndDataAttributes(props)} {...pickWebPressHandlers(props)} type='button' />} />
	);
	const B = (props) => (
		<Frame render={<div {...customProperties({ '--rcx-x': props.x })} {...pickPositionStyle(props)} {...pickWebAnimationHandlers(props)} />} />
	);`;

	assert.deepEqual(messagesFor(code), []);
});

test('allows the row and text input handler picks on the render element', () => {
	const code = `${FRAME}const A = (props) => (
		<Frame render={<li {...pickWebRowHandlers(props)} />} />
	);
	const B = (props) => (
		<Frame render={<input {...pickWebTextInputHandlers(props)} />} />
	);`;

	assert.deepEqual(messagesFor(code), []);
});

test('reports a spread of anything else on the render element', () => {
	for (const spread of ['props', 'rest', '{ ...rest }', 'otherCall(props)', 'obj.method(props)', 'cond && ariaAndDataAttributes(props)']) {
		const code = `${FRAME}const A = ({ ...rest }) => <Frame render={<button {...${spread}} />} />;`;

		const messages = messagesFor(code);

		assert.equal(messages.length, 1, spread);
		assert.match(messages[0], /safe call/, spread);
	}
});

test('reports any spread on a frame, even of a safe call', () => {
	const code = `${FRAME}const A = (props) => <Frame {...props} />;
	const B = (props) => <Frame {...ariaAndDataAttributes(props)} />;`;

	const messages = messagesFor(code);

	assert.equal(messages.length, 2);
	assert.match(messages[0], /never `\{\.\.\.props\}`/);
});

test('reports a spread on a frame declared below the component', () => {
	const code = `const A = (props) => <Frame {...props} />;\nconst Frame = styled(View, {});`;

	assert.equal(messagesFor(code).length, 1);
});

test('reports a frame spread and a render spread on the same element', () => {
	const code = `${FRAME}const A = (props) => <Frame render={<a {...props} />} {...props} />;`;

	assert.equal(messagesFor(code).length, 2);
});

test('leaves spreads on elements that are not frames and not in render alone', () => {
	const code = `${FRAME}const A = (props) => <Other {...props}><button {...props} /></Other>;
	const B = (props) => <Frame onClick={props.onClick} render={<button onClick={props.onClick} />} />;`;

	assert.deepEqual(messagesFor(code), []);
});
