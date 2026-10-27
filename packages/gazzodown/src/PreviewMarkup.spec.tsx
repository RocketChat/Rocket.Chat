import { render, screen } from '@testing-library/react';

import PreviewMarkup from './PreviewMarkup';

it('renders empty', () => {
	const { container } = render(<PreviewMarkup tokens={[]} />);
	expect(container).toBeEmptyDOMElement();
});

it('renders the first block with content when the message starts with a horizontal rule', () => {
	render(
		<PreviewMarkup
			tokens={[
				{ type: 'HORIZONTAL_RULE', value: undefined, fallback: [0, 3] },
				{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: 'Important update' }] },
			]}
		/>,
	);

	expect(screen.getByText('Important update')).toBeInTheDocument();
});
