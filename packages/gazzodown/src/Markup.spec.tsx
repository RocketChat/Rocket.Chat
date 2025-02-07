import { render, screen, waitFor } from '@testing-library/react';
import { Suspense } from 'react';

import { MarkupInteractionContext } from '.';
import Markup from './Markup';

jest.mock('highlight.js', () => ({
	highlightElement: (): void => undefined,
}));

it('renders empty', () => {
	const { container } = render(<Markup tokens={[]} />);
	expect(container).toBeEmptyDOMElement();
});

it('renders a big emoji block', () => {
	render(
		<MarkupInteractionContext.Provider
			value={{
				convertAsciiToEmoji: true,
				useEmoji: true,
			}}
		>
			<Markup
				tokens={[
					{
						type: 'BIG_EMOJI',
						value: [
							{ type: 'EMOJI', value: { type: 'PLAIN_TEXT', value: 'smile' }, shortCode: 'smile' },
							{ type: 'EMOJI', value: undefined, unicode: '😀' },
							{ type: 'EMOJI', value: { type: 'PLAIN_TEXT', value: 'smile' }, shortCode: 'smile' },
						],
					},
				]}
			/>
		</MarkupInteractionContext.Provider>,
	);

	expect(screen.getByRole('presentation')).toHaveTextContent(':smile:😀:smile:');
	expect(screen.getAllByRole('img')).toHaveLength(3);
	expect(screen.getAllByRole('img', { name: ':smile:' })).toHaveLength(2);
});

it('renders a big emoji block with ASCII emoji', () => {
	render(
		<MarkupInteractionContext.Provider
			value={{
				convertAsciiToEmoji: false,
				useEmoji: true,
			}}
		>
			<Markup
				tokens={[
					{
						type: 'BIG_EMOJI',
						value: [
							{ type: 'EMOJI', value: { type: 'PLAIN_TEXT', value: 'slight_smile' }, shortCode: 'slight_smile' },
							{ type: 'EMOJI', value: undefined, unicode: '🙂' },
							{ type: 'EMOJI', value: { type: 'PLAIN_TEXT', value: ':)' }, shortCode: 'slight_smile' },
						],
					},
				]}
			/>
		</MarkupInteractionContext.Provider>,
	);

	expect(screen.getByRole('presentation')).toHaveTextContent(':slight_smile:🙂:)');
	expect(screen.getAllByRole('img')).toHaveLength(2);
	expect(screen.getAllByRole('img', { name: ':slight_smile:' })).toHaveLength(1);
});

it('renders a paragraph', () => {
	render(
		<Markup
			tokens={[
				{
					type: 'PARAGRAPH',
					value: [{ type: 'PLAIN_TEXT', value: 'Hello' }],
				},
			]}
		/>,
	);

	expect(screen.getByText('Hello')).toBeInTheDocument();
});

it('renders a heading', () => {
	render(
		<Markup
			tokens={[
				{
					type: 'HEADING',
					level: 2,
					value: [{ type: 'PLAIN_TEXT', value: 'Hello' }],
				},
			]}
		/>,
	);

	expect(screen.getByRole('heading', { name: 'Hello' })).toBeInTheDocument();
});

it('renders a unordered list', () => {
	render(
		<Markup
			tokens={[
				{
					type: 'UNORDERED_LIST',
					value: [
						{ type: 'LIST_ITEM', value: [{ type: 'PLAIN_TEXT', value: 'Hello' }] },
						{ type: 'LIST_ITEM', value: [{ type: 'PLAIN_TEXT', value: 'Hola' }] },
						{ type: 'LIST_ITEM', value: [{ type: 'PLAIN_TEXT', value: '你好' }] },
					],
				},
			]}
		/>,
	);

	expect(screen.getByRole('list')).toBeInTheDocument();

	const items = screen.getAllByRole('listitem');
	expect(items).toHaveLength(3);

	expect(items[0]).toHaveTextContent('Hello');
	expect(items[1]).toHaveTextContent('Hola');
	expect(items[2]).toHaveTextContent('你好');
});

it('renders an ordered list', () => {
	render(
		<Markup
			tokens={[
				{
					type: 'ORDERED_LIST',
					value: [
						{ type: 'LIST_ITEM', value: [{ type: 'PLAIN_TEXT', value: 'Hello' }] },
						{ type: 'LIST_ITEM', value: [{ type: 'PLAIN_TEXT', value: 'Hola' }] },
						{ type: 'LIST_ITEM', value: [{ type: 'PLAIN_TEXT', value: '你好' }] },
					],
				},
			]}
		/>,
	);

	expect(screen.getByRole('list')).toBeInTheDocument();

	const items = screen.getAllByRole('listitem');
	expect(items).toHaveLength(3);

	expect(items[0]).toHaveTextContent('Hello');
	expect(items[1]).toHaveTextContent('Hola');
	expect(items[2]).toHaveTextContent('你好');
});

it('renders a task list', () => {
	render(
		<Markup
			tokens={[
				{
					type: 'TASKS',
					value: [
						{ type: 'TASK', status: true, value: [{ type: 'PLAIN_TEXT', value: 'Chores' }] },
						{ type: 'TASK', status: false, value: [{ type: 'PLAIN_TEXT', value: 'Dishes' }] },
						{ type: 'TASK', status: true, value: [{ type: 'PLAIN_TEXT', value: 'Laundry' }] },
					],
				},
			]}
		/>,
	);

	expect(screen.getByRole('list')).toBeInTheDocument();

	const items = screen.getAllByRole('listitem');
	expect(items).toHaveLength(3);

	expect(items[0]).toHaveTextContent('Chores');
	expect(items[1]).toHaveTextContent('Dishes');
	expect(items[2]).toHaveTextContent('Laundry');

	const checkboxes = screen.getAllByRole('checkbox');
	expect(checkboxes).toHaveLength(3);

	expect(checkboxes[0]).toBeChecked();
	expect(checkboxes[1]).not.toBeChecked();
	expect(checkboxes[2]).toBeChecked();
});

it('renders a blockquote', () => {
	render(
		<Markup
			tokens={[
				{
					type: 'QUOTE',
					value: [
						{
							type: 'PARAGRAPH',
							value: [{ type: 'PLAIN_TEXT', value: 'Cogito ergo sum.' }],
						},
						{
							type: 'PARAGRAPH',
							value: [{ type: 'PLAIN_TEXT', value: 'Sit amet, consectetur adipiscing elit.' }],
						},
						{
							type: 'PARAGRAPH',
							value: [{ type: 'PLAIN_TEXT', value: 'Donec eget ex euismod, euismod nisi euismod, vulputate nisi.' }],
						},
					],
				},
			]}
		/>,
	);

	expect(screen.getByText('Cogito ergo sum.')).toBeInTheDocument();
	expect(screen.getByText('Sit amet, consectetur adipiscing elit.')).toBeInTheDocument();
	expect(screen.getByText('Donec eget ex euismod, euismod nisi euismod, vulputate nisi.')).toBeInTheDocument();
});

it('renders a code block', async () => {
	render(
		<Suspense fallback={null}>
			<Markup
				tokens={[
					{
						type: 'CODE',
						value: [{ type: 'CODE_LINE', value: { type: 'PLAIN_TEXT', value: 'const foo = bar;' } }],
						language: undefined,
					},
				]}
			/>
		</Suspense>,
	);

	await waitFor(() => expect(screen.getByRole('region')).toBeInTheDocument());

	expect(screen.getByRole('region')).toHaveTextContent('```const foo = bar;```');
});

it('renders a code block with language', async () => {
	render(
		<Suspense fallback={null}>
			<Markup
				tokens={[
					{
						type: 'CODE',
						value: [{ type: 'CODE_LINE', value: { type: 'PLAIN_TEXT', value: 'const foo = bar;' } }],
						language: 'javascript',
					},
				]}
			/>
		</Suspense>,
	);

	await waitFor(() => expect(screen.getByRole('region')).toBeInTheDocument());

	expect(screen.getByRole('region')).toHaveTextContent('```const foo = bar;```');
	expect(screen.getByRole('region').querySelector('.language-javascript')).toBeInTheDocument();
});

it('renders a Katex block', async () => {
	const { container } = render(
		<Suspense fallback={null}>
			<Markup
				tokens={[
					{
						type: 'KATEX',
						value: 'x^2 + y^2 = z^2',
					},
				]}
			/>
		</Suspense>,
	);

	// workaround for jest-dom's inability to handle MathML
	await waitFor(() => expect(container.querySelector('math')).toBeTruthy());
	container.querySelector('math')?.remove();

	expect(screen.getByRole('math', { name: 'x^2 + y^2 = z^2' })).toBeInTheDocument();
});

it('renders a line break', () => {
	const { container } = render(
		<Markup
			tokens={[
				{
					type: 'LINE_BREAK',
					value: undefined,
				},
			]}
		/>,
	);

	expect(container).toContainHTML('<br>');
});

it('renders plain text instead of emojis based on preference', () => {
	render(
		<MarkupInteractionContext.Provider
			value={{
				convertAsciiToEmoji: false,
				useEmoji: false,
			}}
		>
			<Markup
				tokens={[
					{
						type: 'PARAGRAPH',
						value: [
							{ type: 'PLAIN_TEXT', value: 'Hey! ' },
							{ type: 'EMOJI', value: { type: 'PLAIN_TEXT', value: 'smile' }, shortCode: 'smile' },
							{ type: 'PLAIN_TEXT', value: ' ' },
							{ type: 'EMOJI', value: { type: 'PLAIN_TEXT', value: ':)' }, shortCode: 'slight_smile' },
						],
					},
				]}
			/>
		</MarkupInteractionContext.Provider>,
	);

	expect(screen.getByText('Hey! :smile: :)')).toBeInTheDocument();
});

it('renders plain text instead of ASCII emojis based on useEmojis preference', () => {
	render(
		<MarkupInteractionContext.Provider
			value={{
				convertAsciiToEmoji: true,
				useEmoji: false,
			}}
		>
			<Markup
				tokens={[
					{
						type: 'PARAGRAPH',
						value: [
							{ type: 'PLAIN_TEXT', value: 'Hey! ' },
							{ type: 'EMOJI', value: { type: 'PLAIN_TEXT', value: 'smile' }, shortCode: 'smile' },
							{ type: 'PLAIN_TEXT', value: ' ' },
							{ type: 'EMOJI', value: { type: 'PLAIN_TEXT', value: ':)' }, shortCode: 'slight_smile' },
						],
					},
				]}
			/>
		</MarkupInteractionContext.Provider>,
	);

	expect(screen.getByText('Hey! :smile: :)')).toBeInTheDocument();
});
