import { render } from '@testing-library/react';

import InformationPage from './InformationPage';

it('renders without crashing', () => {
	const { container } = render(<InformationPage title='' description='' />);

	expect(container.firstChild).not.toBeNull();
});
