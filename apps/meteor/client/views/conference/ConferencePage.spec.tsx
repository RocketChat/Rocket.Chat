import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import ConferencePage from './ConferencePage';

const handleOpenCall = jest.fn();

jest.mock('../room/contextualBar/VideoConference/hooks/useVideoConfOpenCall', () => ({
	useVideoConfOpenCall: () => handleOpenCall,
}));

const renderAt = (search: string) => {
	window.history.replaceState({}, '', `/conference${search}`);

	return render(<ConferencePage />, { wrapper: mockAppRoot().withJohnDoe().build() });
};

beforeEach(() => {
	handleOpenCall.mockClear();
});

afterEach(() => {
	window.history.replaceState({}, '', '/');
});

// The address comes from whoever wrote the link, and this page opens it.
it('opens the call the link names', () => {
	renderAt('?callUrl=https%3A%2F%2Fmeet.example%2Froom-1');

	expect(handleOpenCall).toHaveBeenCalledWith(expect.stringContaining('https://meet.example/room-1'));
});

// A provider is free to answer with a relative address, and those work today: this guard is not about them.
it('opens a relative address, which is still somewhere to go', () => {
	renderAt('?callUrl=%2Fchannel%2Fgeneral');

	expect(handleOpenCall).toHaveBeenCalledWith(expect.stringContaining('/channel/general'));
});

// Not a location — it executes, in a window this page opened.
it.each(['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'vbscript:msgbox(1)'])(
	'refuses %s rather than opening it',
	(candidate) => {
		renderAt(`?callUrl=${encodeURIComponent(candidate)}`);

		expect(handleOpenCall).not.toHaveBeenCalled();
		expect(screen.getByText('Call_not_found')).toBeInTheDocument();
	},
);
