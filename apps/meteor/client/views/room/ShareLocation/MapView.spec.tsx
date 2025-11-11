import { render, screen, fireEvent } from '@testing-library/react';

import MapView from './MapView';

jest.mock('@rocket.chat/ui-contexts', () => ({
	useTranslation: () => (key: string) => key,
}));

describe('MapView', () => {
	const lat = 1.234567;
	const lon = 2.345678;

	test('renders fallback placeholder when no mapInstance', () => {
		render(<MapView latitude={lat} longitude={lon} width={300} height={200} />);

		// Uses literal aria-label/title strings in component
		const fallback = screen.getByLabelText('Map preview unavailable');
		expect(fallback).toBeInTheDocument();
		// Coordinates shown with 5 decimals
		expect(screen.getByText(/1\.23457, 2\.34568/)).toBeInTheDocument();
		// No image should be rendered
		expect(screen.queryByRole('img')).not.toBeInTheDocument();
	});

	test('renders static map image and attribution when mapInstance provided', () => {
		const mockSrc = 'https://static.example/map.png';
		const mapInstance = {
			getStaticMapUrl: jest.fn(() => mockSrc),
		} as any;

		render(<MapView latitude={lat} longitude={lon} width={300} height={200} mapInstance={mapInstance} />);

		const img = screen.getByRole('img');
		expect(img).toHaveAttribute('src', mockSrc);
		expect(img).toHaveAttribute('alt', 'Map_Preview_Alt');
		// Attribution string is translated key in tests
		expect(screen.getByText('OSM_Attribution')).toBeInTheDocument();
	});

	test('hides attribution when showAttribution is false', () => {
		const mapInstance = {
			getStaticMapUrl: jest.fn(() => 'https://static.example/map.png'),
		} as any;

		render(<MapView latitude={lat} longitude={lon} width={300} height={200} mapInstance={mapInstance} showAttribution={false} />);

		expect(screen.queryByText('OSM_Attribution')).not.toBeInTheDocument();
	});

	test('falls back to placeholder when image fails to load', () => {
		const mapInstance = {
			getStaticMapUrl: jest.fn(() => 'https://static.example/map.png'),
		} as any;

		render(<MapView latitude={lat} longitude={lon} width={300} height={200} mapInstance={mapInstance} />);

		const img = screen.getByRole('img');
		fireEvent.error(img);

		// After error, placeholder should appear
		expect(screen.getByLabelText('Map preview unavailable')).toBeInTheDocument();
	});
});
