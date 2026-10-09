import { DEFAULT_LOCAL_SETTINGS } from '@rocket.chat/site-replication';

import { readSiteReplicationConfig } from './config';

const complete = {
	SITE_REPLICATION_SITE_ID: 'east',
	SITE_REPLICATION_PEER_ID: 'west',
	SITE_REPLICATION_PEER_URL: 'https://west.example.com:3200',
	SITE_REPLICATION_SECRET: 'shared',
};

describe('readSiteReplicationConfig', () => {
	it('leaves replication off when no peer is configured', () => {
		expect(readSiteReplicationConfig({})).toBeUndefined();
	});

	it('refuses a peer without the identities and secret', () => {
		expect(() => readSiteReplicationConfig({ SITE_REPLICATION_PEER_URL: 'https://west.example.com' })).toThrow(
			'SITE_REPLICATION_SITE_ID, SITE_REPLICATION_PEER_ID, SITE_REPLICATION_SECRET',
		);
	});

	it('applies defaults to a minimal configuration', () => {
		expect(readSiteReplicationConfig(complete)).toEqual({
			site: 'east',
			siteName: 'east',
			peer: { site: 'west', url: 'https://west.example.com:3200' },
			secret: 'shared',
			listen: { port: 3200, host: '0.0.0.0' },
			partitionThresholdMs: 30_000,
			localSettings: DEFAULT_LOCAL_SETTINGS,
		});
	});

	it('adds extra local settings to the defaults', () => {
		const config = readSiteReplicationConfig({ ...complete, SITE_REPLICATION_LOCAL_SETTINGS: 'Site_Url, Accounts_OAuth_Custom-x ' });
		expect(config?.localSettings).toEqual([...DEFAULT_LOCAL_SETTINGS, 'Site_Url', 'Accounts_OAuth_Custom-x']);
	});
});
