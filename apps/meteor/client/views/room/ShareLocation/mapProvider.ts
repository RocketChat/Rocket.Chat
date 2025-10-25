// mapProvider.ts

export type MapProviderName = 'openstreetmap';

export type ProviderOpts = {
	apiKey?: string;
};

export interface IMapProvider {
	name: MapProviderName;
	getStaticMapUrl(lat: number, lng: number, opts?: { zoom?: number; width?: number; height?: number }): string;
	getMapsLink(lat: number, lng: number): string;
	getAttribution(): string;
}

export class OSMProvider implements IMapProvider {
	name: MapProviderName = 'openstreetmap';

	private readonly _opts: ProviderOpts;

	constructor(opts: ProviderOpts = {}) {
		// store options for future extensibility (e.g., API keys, style params)
		this._opts = opts;
		// read to avoid TS "is declared but its value is never read" when not yet used
		void this._opts;
	}

	getStaticMapUrl(lat: number, lng: number, opts?: { zoom?: number; width?: number; height?: number }): string {
		const zoom = opts?.zoom ?? 15;
		const width = opts?.width ?? 600;
		const height = opts?.height ?? 320;

		return `https://staticmap.openstreetmap.fr/staticmap.php?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&markers=${lat},${lng},red-pushpin`;
	}

	getMapsLink(lat: number, lng: number): string {
		const defaultZoom = 16;
		return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${defaultZoom}/${lat}/${lng}`;
	}

	getAttribution(): string {
		return '© OpenStreetMap contributors';
	}
}

export function createMapProvider(name: MapProviderName = 'openstreetmap', opts: ProviderOpts = {}): IMapProvider {
	switch (name) {
		case 'openstreetmap':
		default:
			return new OSMProvider(opts);
	}
}
