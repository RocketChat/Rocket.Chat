import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

import ConferenceRoute from './ConferenceRoute';

const mockReceived = jest.fn();

jest.mock('./ConferenceLinkGate', () => ({
	__esModule: true,
	default: ({ segment }: { segment: string }) => <p>{`gate for ${segment}`}</p>,
}));
jest.mock('./ConferenceStartPage', () => ({
	__esModule: true,
	default: ({ rid }: { rid: string }) => <p>{`start page in ${rid}`}</p>,
}));
jest.mock('./ConferencePage', () => ({ __esModule: true, default: () => <p>guest page</p> }));
jest.mock('./ConferencePageError', () => ({ __esModule: true, default: () => <p>error page</p> }));
jest.mock('../root/MainLayout/AuthenticationCheck', () => ({
	__esModule: true,
	default: ({ guest, children }: { guest?: boolean; children: ReactNode }) => {
		mockReceived({ guest });
		return <section aria-label='authentication check'>{children}</section>;
	},
}));

const renderRoute = ({ id, search = {} }: { id?: string; search?: Record<string, string> }) => {
	const builder = mockAppRoot().withRouter({ getSearchParameters: () => search });

	if (id) {
		builder.withRouteParameter('id', id);
	}

	return render(<ConferenceRoute />, { wrapper: builder.build() });
};

beforeEach(() => {
	mockReceived.mockClear();
});

// A call id and a link address are the same kind of segment: the gate tells them apart by asking the server.
it('renders the link gate for a call id or an address, inside the authentication check that refuses guests', () => {
	const { unmount } = renderRoute({ id: 'weekly-sync' });

	expect(screen.getByRole('region', { name: 'authentication check' })).toContainElement(screen.getByText('gate for weekly-sync'));
	expect(mockReceived).toHaveBeenCalledWith({ guest: false });
	unmount();

	renderRoute({ id: 'call-id' });
	expect(screen.getByText('gate for call-id')).toBeInTheDocument();
});

it('renders the start page for new with a room', () => {
	renderRoute({ id: 'new', search: { rid: 'room-id' } });

	expect(screen.getByText('start page in room-id')).toBeInTheDocument();
	expect(screen.queryByText(/^gate for/)).not.toBeInTheDocument();
	expect(mockReceived).toHaveBeenCalledWith({ guest: false });
});

it('renders the guest page for a callUrl', () => {
	renderRoute({ id: 'call-id', search: { callUrl: 'https://call.example' } });

	expect(screen.getByText('guest page')).toBeInTheDocument();
	expect(screen.queryByText(/^gate for/)).not.toBeInTheDocument();
	expect(mockReceived).toHaveBeenCalledWith({ guest: true });
});

it('renders the error page without an id', () => {
	renderRoute({});

	expect(screen.getByText('error page')).toBeInTheDocument();
	expect(mockReceived).not.toHaveBeenCalled();
});
