import { render } from '@testing-library/react';

import EmailConfirmedPage from './EmailConfirmedPage';

it('renders without crashing', () => {
	const { container } = render(<EmailConfirmedPage />);

	expect(container).not.toBeEmptyDOMElement();
});
