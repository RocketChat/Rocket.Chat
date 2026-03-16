import { render, screen } from '@testing-library/react';

import PreviewCodeBlock from './PreviewCodeBlock';

const codeLines = (strings: string[]) =>
	strings.map((value) => ({ type: 'CODE_LINE' as const, value: { type: 'PLAIN_TEXT' as const, value } }));

describe('PreviewCodeBlock', () => {
	it('renders the first non-empty line', () => {
		render(<PreviewCodeBlock lines={codeLines(['first line', 'second line'])} />);
		expect(screen.getByText('first line')).toBeInTheDocument();
	});

	it('skips empty lines and renders the first non-empty one', () => {
		render(<PreviewCodeBlock lines={codeLines(['', '  ', 'actual content'])} />);
		expect(screen.getByText('actual content')).toBeInTheDocument();
	});

	it('renders nothing when all lines are empty', () => {
		const { container } = render(<PreviewCodeBlock lines={codeLines(['', '   ', ''])} />);
		expect(container).toBeEmptyDOMElement();
	});

	it('renders nothing when lines array is empty', () => {
		const { container } = render(<PreviewCodeBlock lines={[]} />);
		expect(container).toBeEmptyDOMElement();
	});

	it('trims whitespace from the displayed line', () => {
		render(<PreviewCodeBlock lines={codeLines(['  padded  '])} />);
		expect(screen.getByText('padded')).toBeInTheDocument();
	});

	it('ignores the language prop', () => {
		render(<PreviewCodeBlock lines={codeLines(['code here'])} language='javascript' />);
		expect(screen.getByText('code here')).toBeInTheDocument();
	});

	it('matches snapshot', () => {
		const { container } = render(<PreviewCodeBlock lines={codeLines(['const x = 42;'])} />);
		expect(container).toMatchSnapshot();
	});
});
