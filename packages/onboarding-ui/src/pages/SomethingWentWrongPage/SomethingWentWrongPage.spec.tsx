import { render } from '@testing-library/react';

import SomethingWentWrongPage from './SomethingWentWrongPage';

it('renders without crashing', () => {
	const { container } = render(<SomethingWentWrongPage />);

	expect(container.firstChild).not.toBeNull();
});
