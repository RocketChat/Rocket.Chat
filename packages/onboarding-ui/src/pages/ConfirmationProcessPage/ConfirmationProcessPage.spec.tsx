import { render } from '@testing-library/react';

import ConfirmationProcessPage from './ConfirmationProcessPage';

it('renders without crashing', () => {
	const { container } = render(<ConfirmationProcessPage />);

	expect(container.firstChild).not.toBeNull();
});
