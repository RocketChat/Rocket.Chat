import { render } from '@testing-library/react';

import InvalidLinkPage from './InvalidLinkPage';

it('renders without crashing', () => {
	const { container } = render(<InvalidLinkPage onRequestNewLink={() => undefined} />);

	expect(container.firstChild).not.toBeNull();
});
