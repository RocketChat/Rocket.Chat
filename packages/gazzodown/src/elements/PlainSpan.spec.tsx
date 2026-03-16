import { render, screen } from '@testing-library/react';

import { MarkupInteractionContext } from '..';
import PlainSpan from './PlainSpan';

describe('PlainSpan', () => {
	it('renders plain text', () => {
		render(<PlainSpan text='Hello World' />);
		expect(screen.getByText('Hello World')).toBeInTheDocument();
	});

	it('renders highlighted text with highlightRegex', () => {
		render(
			<MarkupInteractionContext.Provider value={{ highlightRegex: () => /(World)/gi }}>
				<PlainSpan text='Hello World' />
			</MarkupInteractionContext.Provider>,
		);

		expect(screen.getByText('World')).toBeInTheDocument();
		expect(screen.getByText('World').tagName).toBe('MARK');
	});

	it('renders marked text with markRegex', () => {
		render(
			<MarkupInteractionContext.Provider value={{ markRegex: () => /(test)/gi }}>
				<PlainSpan text='A test string' />
			</MarkupInteractionContext.Provider>,
		);

		expect(screen.getByText('test')).toBeInTheDocument();
		expect(screen.getByText('test').tagName).toBe('MARK');
	});

	it('renders text without highlighting when no regex provided', () => {
		render(<PlainSpan text='Normal text' />);
		expect(screen.queryByText((_, el) => el?.tagName === 'MARK')).not.toBeInTheDocument();
		expect(screen.getByText('Normal text')).toBeInTheDocument();
	});

	it('matches snapshot with highlighting', () => {
		const { container } = render(
			<MarkupInteractionContext.Provider value={{ highlightRegex: () => /(World)/gi }}>
				<PlainSpan text='Hello World Goodbye World' />
			</MarkupInteractionContext.Provider>,
		);
		expect(container).toMatchSnapshot();
	});
});
