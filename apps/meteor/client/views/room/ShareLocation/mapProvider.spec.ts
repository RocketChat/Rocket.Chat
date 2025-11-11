import { createMapProvider, OSMProvider } from './mapProvider';

describe('mapProvider (OSM)', () => {
	it('creates an OSMProvider by default', () => {
		const provider = createMapProvider();
		expect(provider).toBeInstanceOf(OSMProvider);
		expect(provider.name).toBe('openstreetmap');
	});

	it('getStaticMapUrl builds expected URL', () => {
		const provider = createMapProvider();
		const url = provider.getStaticMapUrl(10.5, 20.75, { zoom: 12, width: 512, height: 256 });
		expect(url).toBe(
			'https://staticmap.openstreetmap.fr/staticmap.php?center=10.5,20.75&zoom=12&size=512x256&markers=10.5,20.75,red-pushpin',
		);
	});

	it('getMapsLink builds expected OSM link with default zoom 16', () => {
		const provider = createMapProvider();
		const link = provider.getMapsLink(1.2345, -2.3456);
		expect(link).toBe('https://www.openstreetmap.org/?mlat=1.2345&mlon=-2.3456#map=16/1.2345/-2.3456');
	});

	it('getAttribution returns OSM attribution', () => {
		const provider = createMapProvider();
		expect(provider.getAttribution()).toContain('OpenStreetMap');
	});
});
