import { render } from '@testing-library/react';

import InvalidLinkPage from './InvalidLinkPage';

it('renders without crashing', () => {
	render(<InvalidLinkPage onRequestNewLink={() => undefined} />);
});
