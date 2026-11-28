import { render } from '@testing-library/react';

import EmailConfirmedPage from './EmailConfirmedPage.js';

it('renders without crashing', () => {
	const { container } = render(<EmailConfirmedPage />);

	expect(container).not.toBeEmptyDOMElement();
});
