import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render } from '@testing-library/react';

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

// `javascript:`/`data:` are not locations — they execute, in a window this page opened. A relative path is not
// a call either: it resolves against this origin, so it would open the workspace itself in a call window.
it.each([
	['javascript:alert(1)', 'a script'],
	['data:text/html,<script>alert(1)</script>', 'a document'],
	['vbscript:msgbox(1)', 'a script'],
	['/admin/settings', 'a page of our own'],
	['//evil.example/x', 'a protocol-relative address'],
])('opens nothing for %s, being %s rather than a call', (candidate) => {
	renderAt(`?callUrl=${encodeURIComponent(candidate)}`);

	expect(handleOpenCall).not.toHaveBeenCalled();
});
