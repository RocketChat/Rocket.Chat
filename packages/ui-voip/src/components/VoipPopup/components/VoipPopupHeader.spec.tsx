import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import VoipPopupHeader from './VoipPopupHeader';

it('should render title', () => {
	render(<VoipPopupHeader>voice call header title</VoipPopupHeader>, { wrapper: mockAppRoot().build() });

	expect(screen.getByText('voice call header title')).toBeInTheDocument();
});

it('should not render close button when onClose is not provided', () => {
	render(<VoipPopupHeader />, { wrapper: mockAppRoot().build() });

	expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
});

it('should render close button when onClose is provided', () => {
	render(<VoipPopupHeader onClose={jest.fn()} />, { wrapper: mockAppRoot().build() });

	expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
});

it('should call onClose when close button is clicked', async () => {
	const closeFn = jest.fn();
	render(<VoipPopupHeader onClose={closeFn} />, { wrapper: mockAppRoot().build() });

	await userEvent.click(screen.getByRole('button', { name: 'Close' }));
	expect(closeFn).toHaveBeenCalled();
});

it('should render settings button by default', () => {
	render(<VoipPopupHeader />, { wrapper: mockAppRoot().build() });

	expect(screen.getByRole('button', { name: /Device_settings/ })).toBeInTheDocument();
});

it('should not render settings button when hideSettings is true', () => {
	render(<VoipPopupHeader hideSettings>text</VoipPopupHeader>, { wrapper: mockAppRoot().build() });

	expect(screen.queryByRole('button', { name: /Device_settings/ })).not.toBeInTheDocument();
});
