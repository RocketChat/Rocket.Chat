import { render, screen } from '@testing-library/react';

import VoipStatus from './VoipStatus';

it('should not render any status', () => {
	render(<VoipStatus isHeld={false} isMuted={false} />);

	expect(screen.queryByText('On_Hold')).not.toBeInTheDocument();
	expect(screen.queryByText('Muted')).not.toBeInTheDocument();
});

it('should display on hold status', () => {
	render(<VoipStatus isHeld isMuted={false} />);

	expect(screen.getByText('On_Hold')).toBeInTheDocument();
	expect(screen.queryByText('Muted')).not.toBeInTheDocument();
});

it('should display muted status', () => {
	render(<VoipStatus isHeld={false} isMuted />);

	expect(screen.queryByText('On_Hold')).not.toBeInTheDocument();
	expect(screen.getByText('Muted')).toBeInTheDocument();
});

it('should display all statuses', () => {
	render(<VoipStatus isHeld isMuted />);

	expect(screen.getByText('On_Hold')).toBeInTheDocument();
	expect(screen.getByText('Muted')).toBeInTheDocument();
});
