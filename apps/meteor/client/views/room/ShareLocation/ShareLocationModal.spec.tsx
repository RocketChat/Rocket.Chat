import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import ShareLocationModal from './ShareLocationModal';

jest.mock('./getGeolocationPermission', () => ({ getGeolocationPermission: async () => 'granted' }));
jest.mock('./getGeolocationPosition', () => ({ getGeolocationPosition: async () => ({ coords: { latitude: 10, longitude: 20 } }) }));

it('previews the location to share with the map (message-attachments R23)', async () => {
	render(<ShareLocationModal rid='rid' tmid={undefined} onClose={jest.fn()} />, {
		wrapper: mockAppRoot().withSetting('MapView_GMapsAPIKey', '').build(),
	});

	expect(await screen.findByText('Share_Location_Title')).toBeInTheDocument();

	expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
	expect(screen.getByRole('link')).toHaveAttribute('href', expect.stringContaining('10,20'));
});
