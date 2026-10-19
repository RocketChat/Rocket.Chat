import { render } from '@testing-library/react';

import TaggedRocketChatLogo from './TaggedRocketChatLogo';

it('renders without crashing', () => {
	const { container } = render(<TaggedRocketChatLogo />);

	expect(container.firstChild).not.toBeNull();
});
