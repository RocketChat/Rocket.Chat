import { render, screen } from '@testing-library/react';

import { MarkupInteractionContext } from '.';
import PreviewMarkup from './PreviewMarkup';

it('renders null for empty tokens', () => {
	const { container } = render(<PreviewMarkup tokens={[]} />);
	expect(container).toBeEmptyDOMElement();
});

it('renders null for only line breaks', () => {
	const { container } = render(
		<PreviewMarkup
			tokens={[
				{ type: 'LINE_BREAK', value: undefined },
				{ type: 'LINE_BREAK', value: undefined },
			]}
		/>,
	);
	expect(container).toBeEmptyDOMElement();
});

it('renders a big emoji block preview', () => {
	render(
		<MarkupInteractionContext.Provider value={{ convertAsciiToEmoji: true, useEmoji: true }}>
			<PreviewMarkup
				tokens={[
					{
						type: 'BIG_EMOJI',
						value: [{ type: 'EMOJI', value: undefined, unicode: '😀' }],
					},
				]}
			/>
		</MarkupInteractionContext.Provider>,
	);

	expect(screen.getByRole('img')).toBeInTheDocument();
});

it('renders paragraph preview as inline elements', () => {
	render(
		<PreviewMarkup
			tokens={[
				{
					type: 'PARAGRAPH',
					value: [{ type: 'PLAIN_TEXT', value: 'Hello World' }],
				},
			]}
		/>,
	);

	expect(screen.getByText('Hello World')).toBeInTheDocument();
});

it('renders heading preview as plain text', () => {
	render(
		<PreviewMarkup
			tokens={[
				{
					type: 'HEADING',
					level: 1,
					value: [{ type: 'PLAIN_TEXT', value: 'Title' }],
				},
			]}
		/>,
	);

	expect(screen.getByText('Title')).toBeInTheDocument();
});

it('renders first item of unordered list with dash prefix', () => {
	const { container } = render(
		<PreviewMarkup
			tokens={[
				{
					type: 'UNORDERED_LIST',
					value: [
						{ type: 'LIST_ITEM', value: [{ type: 'PLAIN_TEXT', value: 'First' }] },
						{ type: 'LIST_ITEM', value: [{ type: 'PLAIN_TEXT', value: 'Second' }] },
					],
				},
			]}
		/>,
	);

	expect(container.textContent).toContain('First');
	expect(container.textContent).not.toContain('Second');
});

it('renders first item of ordered list with number prefix', () => {
	const { container } = render(
		<PreviewMarkup
			tokens={[
				{
					type: 'ORDERED_LIST',
					value: [
						{ type: 'LIST_ITEM', value: [{ type: 'PLAIN_TEXT', value: 'First' }], number: 1 },
						{ type: 'LIST_ITEM', value: [{ type: 'PLAIN_TEXT', value: 'Second' }], number: 2 },
					],
				},
			]}
		/>,
	);

	expect(container.textContent).toContain('First');
	expect(container.textContent).not.toContain('Second');
});

it('renders first task with checkbox symbol', () => {
	const { container } = render(
		<PreviewMarkup
			tokens={[
				{
					type: 'TASKS',
					value: [
						{ type: 'TASK', status: true, value: [{ type: 'PLAIN_TEXT', value: 'Done task' }] },
						{ type: 'TASK', status: false, value: [{ type: 'PLAIN_TEXT', value: 'Pending' }] },
					],
				},
			]}
		/>,
	);

	expect(container.textContent).toContain('Done task');
	expect(container.textContent).not.toContain('Pending');
	expect(container.textContent).toContain('\u2611');
});

it('renders unchecked task with empty checkbox symbol', () => {
	const { container } = render(
		<PreviewMarkup
			tokens={[
				{
					type: 'TASKS',
					value: [{ type: 'TASK', status: false, value: [{ type: 'PLAIN_TEXT', value: 'Todo' }] }],
				},
			]}
		/>,
	);

	expect(container.textContent).toContain('\u2610');
});

it('renders quote preview with > prefix', () => {
	const { container } = render(
		<PreviewMarkup
			tokens={[
				{
					type: 'QUOTE',
					value: [
						{
							type: 'PARAGRAPH',
							value: [{ type: 'PLAIN_TEXT', value: 'Quoted text' }],
						},
					],
				},
			]}
		/>,
	);

	expect(container.textContent).toContain('Quoted text');
	expect(container.textContent).toContain('>');
});

it('renders spoiler block preview content', () => {
	render(
		<PreviewMarkup
			tokens={[
				{
					type: 'SPOILER_BLOCK',
					value: [
						{
							type: 'PARAGRAPH',
							value: [{ type: 'PLAIN_TEXT', value: 'Spoiler content' }],
						},
					],
				},
			]}
		/>,
	);

	expect(screen.getByText('Spoiler content')).toBeInTheDocument();
});

it('renders code block preview with first line', () => {
	render(
		<PreviewMarkup
			tokens={[
				{
					type: 'CODE',
					value: [
						{ type: 'CODE_LINE', value: { type: 'PLAIN_TEXT', value: 'const x = 1;' } },
						{ type: 'CODE_LINE', value: { type: 'PLAIN_TEXT', value: 'const y = 2;' } },
					],
					language: 'javascript',
				},
			]}
		/>,
	);

	expect(screen.getByText('const x = 1;')).toBeInTheDocument();
});

it('skips leading line breaks and renders first real block', () => {
	render(
		<PreviewMarkup
			tokens={[
				{ type: 'LINE_BREAK', value: undefined },
				{
					type: 'PARAGRAPH',
					value: [{ type: 'PLAIN_TEXT', value: 'After break' }],
				},
			]}
		/>,
	);

	expect(screen.getByText('After break')).toBeInTheDocument();
});

it('matches snapshot for paragraph preview', () => {
	const { container } = render(
		<PreviewMarkup
			tokens={[
				{
					type: 'PARAGRAPH',
					value: [{ type: 'PLAIN_TEXT', value: 'Snapshot test' }],
				},
			]}
		/>,
	);

	expect(container).toMatchSnapshot();
});
