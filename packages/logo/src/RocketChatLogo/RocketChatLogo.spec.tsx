import { render, screen } from '@testing-library/react';

import RocketChatLogo from './RocketChatLogo.js';

it('renders the Rocket.Chat logo', () => {
	render(<RocketChatLogo />);
	expect(screen.getByLabelText('Rocket.Chat')).toBeInstanceOf(SVGSVGElement);
});
