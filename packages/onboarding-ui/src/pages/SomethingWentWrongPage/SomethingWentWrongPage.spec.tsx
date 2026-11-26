import { render } from '@testing-library/react';

import SomethingWentWrongPage from './SomethingWentWrongPage.js';

it('renders without crashing', () => {
	const { container } = render(<SomethingWentWrongPage />);

	expect(container).not.toBeEmptyDOMElement();
});
