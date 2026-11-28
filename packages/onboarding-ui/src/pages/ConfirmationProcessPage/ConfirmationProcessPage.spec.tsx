import { render } from '@testing-library/react';

import ConfirmationProcessPage from './ConfirmationProcessPage.js';

it('renders without crashing', () => {
	const { container } = render(<ConfirmationProcessPage />);

	expect(container).not.toBeEmptyDOMElement();
});
