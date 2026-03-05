import { render, screen } from '@testing-library/react';

import HeadingBlock from './HeadingBlock';

describe('HeadingBlock', () => {
	it('renders h1 by default', () => {
		render(<HeadingBlock>{[{ type: 'PLAIN_TEXT', value: 'Title' }]}</HeadingBlock>);
		const heading = screen.getByRole('heading', { level: 1 });
		expect(heading).toHaveTextContent('Title');
	});

	it.each([1, 2, 3, 4] as const)('renders h%i when level is %i', (level) => {
		render(<HeadingBlock level={level}>{[{ type: 'PLAIN_TEXT', value: `Heading ${level}` }]}</HeadingBlock>);
		expect(screen.getByRole('heading', { level })).toHaveTextContent(`Heading ${level}`);
	});

	it('renders empty heading with no children', () => {
		render(<HeadingBlock />);
		expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
	});

	it('matches snapshot', () => {
		const { container } = render(<HeadingBlock level={2}>{[{ type: 'PLAIN_TEXT', value: 'Snapshot heading' }]}</HeadingBlock>);
		expect(container).toMatchSnapshot();
	});
});
