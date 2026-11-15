import { render, screen } from '@testing-library/react';

import TaggedRocketChatLogo from './TaggedRocketChatLogo';

it('renders the Rocket.Chat logo', () => {
	render(<TaggedRocketChatLogo />);
	expect(screen.getByLabelText('Rocket.Chat')).toBeInstanceOf(SVGSVGElement);
});
