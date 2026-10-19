import { render } from '@testing-library/react';

import RocketChatLogo from './RocketChatLogo';

it('renders without crashing', () => {
	const { container } = render(<RocketChatLogo />);

	expect(container.firstChild).not.toBeNull();
});
