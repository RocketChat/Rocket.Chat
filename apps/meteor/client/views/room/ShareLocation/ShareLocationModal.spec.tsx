import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

import ShareLocationModal from './ShareLocationModal';
import { getGeolocationPermission } from './getGeolocationPermission';
import { getGeolocationPosition } from './getGeolocationPosition';

// Spy to capture messages sent via endpoint
const sendMessageSpy = jest.fn().mockResolvedValue({});

jest.mock('@rocket.chat/ui-contexts', () => ({
	useTranslation: () => (key: string) => key,
	useEndpoint: () => sendMessageSpy,
	useToastMessageDispatch: () => jest.fn(),
}));

// Simplify modal rendering for tests
jest.mock('@rocket.chat/ui-client', () => ({
	GenericModal: ({ title, confirmText, cancelText, onConfirm, onCancel, onClose, children }: any) => (
		<div>
			<div data-testid='modal-title'>{title}</div>
			<div data-testid='modal-body'>{children}</div>
			{cancelText ? (
				<button type='button' onClick={onCancel}>
					{cancelText}
				</button>
			) : null}
			{confirmText ? (
				<button type='button' onClick={onConfirm}>
					{confirmText}
				</button>
			) : null}
			{onClose ? (
				<button type='button' onClick={onClose}>
					close
				</button>
			) : null}
		</div>
	),
}));

// Map preview component is irrelevant to logic; mock it out
jest.mock('./MapLibreMap', () => () => <div data-testid='maplibre' />);

// Mock map provider so link generation is deterministic
jest.mock('./mapProvider', () => ({
	createMapProvider: jest.fn(() => ({
		getMapsLink: (lat: number, lon: number) => `https://maps.example/?lat=${lat}&lon=${lon}`,
	})),
}));

jest.mock('./getGeolocationPermission', () => ({
	getGeolocationPermission: jest.fn(),
}));

jest.mock('./getGeolocationPosition', () => ({
	getGeolocationPosition: jest.fn(),
}));

const renderWithClient = (ui: React.ReactElement) => {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
};

beforeEach(() => {
	jest.clearAllMocks();
});

describe('ShareLocationModal', () => {
	test('initial choose stage and live-location disabled flow', () => {
		renderWithClient(<ShareLocationModal rid='RID123' onClose={jest.fn()} />);

		// Choose modal shows options
		expect(screen.getByText('Current_Location')).toBeInTheDocument();
		expect(screen.getByText('Live_Location')).toBeInTheDocument();

		// Click Live_Location (cancel) -> shows disabled placeholder modal
		fireEvent.click(screen.getByText('Live_Location'));
		expect(screen.getByText('Live_Location_Disabled_Body')).toBeInTheDocument();

		// Close returns to choose stage
		fireEvent.click(screen.getByText('Ok'));
		expect(screen.getByText('Current_Location')).toBeInTheDocument();
	});

	test('static flow: requests permission/position, shows preview, and sends message on Share', async () => {
		(getGeolocationPermission as jest.Mock).mockResolvedValue('prompt');
		(getGeolocationPosition as jest.Mock).mockResolvedValue({
			coords: { latitude: 10.1234, longitude: 20.5678 },
		});

		const onClose = jest.fn();
		renderWithClient(<ShareLocationModal rid='RID999' tmid='TID42' onClose={onClose} />);

		// Go to static flow
		fireEvent.click(screen.getByText('Current_Location'));

		// Permission gating modal
		expect(screen.getByText('You_will_be_asked_for_permissions')).toBeInTheDocument();

		// Continue triggers position fetch and sets permission to granted
		fireEvent.click(screen.getByText('Continue'));

		// After data arrives, preview modal with map and Share button should appear
		await screen.findByTestId('maplibre');
		expect(screen.getByText('Share')).toBeInTheDocument();

		// Share -> sends message and closes
		fireEvent.click(screen.getByText('Share'));

		await waitFor(() => expect(sendMessageSpy).toHaveBeenCalled());
		const payload = sendMessageSpy.mock.calls[0][0];
		expect(payload).toMatchObject({ message: expect.objectContaining({ rid: 'RID999', tmid: 'TID42' }) });
		// Contains link and formatted coordinates
		expect(payload.message.msg).toContain('View on OpenStreetMap');
		expect(payload.message.msg).toContain('10.1234°');
		expect(payload.message.msg).toContain('20.5678°');

		await waitFor(() => expect(onClose).toHaveBeenCalled());
	});

	test('static flow: permission denied shows error modal and closes on Ok', async () => {
		(getGeolocationPermission as jest.Mock).mockResolvedValue('denied');
		const onClose = jest.fn();
		renderWithClient(<ShareLocationModal rid='RID-DENY' onClose={onClose} />);

		// Move to static stage
		fireEvent.click(screen.getByText('Current_Location'));

		// Denied modal
		await screen.findByText('Cannot_share_your_location');
		fireEvent.click(screen.getByText('Ok'));

		expect(onClose).toHaveBeenCalled();
	});
});
