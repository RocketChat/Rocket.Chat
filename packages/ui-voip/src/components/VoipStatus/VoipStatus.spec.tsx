import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import VoipStatus from './VoipStatus';

it('should not render any status', () => {
	render(<VoipStatus isHeld={false} isMuted={false} />, { wrapper: mockAppRoot().build() });

	expect(screen.queryByText('On_Hold')).not.toBeInTheDocument();
	expect(screen.queryByText('Muted')).not.toBeInTheDocument();
});

it('should display on hold status', () => {
	render(<VoipStatus isHeld isMuted={false} />, { wrapper: mockAppRoot().build() });

	expect(screen.getByText('On_Hold')).toBeInTheDocument();
	expect(screen.queryByText('Muted')).not.toBeInTheDocument();
});

it('should display muted status', () => {
	render(<VoipStatus isHeld={false} isMuted />, { wrapper: mockAppRoot().build() });

	expect(screen.queryByText('On_Hold')).not.toBeInTheDocument();
	expect(screen.getByText('Muted')).toBeInTheDocument();
});

it('should display all statuses', () => {
	render(<VoipStatus isHeld isMuted />, { wrapper: mockAppRoot().build() });

	expect(screen.getByText('On_Hold')).toBeInTheDocument();
	expect(screen.getByText('Muted')).toBeInTheDocument();
});
