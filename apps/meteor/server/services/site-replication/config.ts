import { DEFAULT_LOCAL_SETTINGS } from '@rocket.chat/site-replication';

export type SiteReplicationConfig = {
	site: string;
	siteName: string;
	peer: { site: string; url: string };
	secret: string;
	listen: { port: number; host: string };
	partitionThresholdMs: number;
	localSettings: string[];
};

const list = (value: string | undefined): string[] =>
	(value ?? '')
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean);

/** The site replication settings from the environment, or undefined when this server does not replicate. */
export const readSiteReplicationConfig = (env: NodeJS.ProcessEnv = process.env): SiteReplicationConfig | undefined => {
	if (!env.SITE_REPLICATION_PEER_URL) {
		return undefined;
	}
	const missing = ['SITE_REPLICATION_SITE_ID', 'SITE_REPLICATION_PEER_ID', 'SITE_REPLICATION_SECRET'].filter((name) => !env[name]);
	if (missing.length) {
		throw new Error(`Site replication needs ${missing.join(', ')} when SITE_REPLICATION_PEER_URL is set`);
	}
	const site = env.SITE_REPLICATION_SITE_ID as string;
	return {
		site,
		siteName: env.SITE_REPLICATION_SITE_NAME || site,
		peer: { site: env.SITE_REPLICATION_PEER_ID as string, url: env.SITE_REPLICATION_PEER_URL },
		secret: env.SITE_REPLICATION_SECRET as string,
		listen: { port: Number(env.SITE_REPLICATION_PORT || 3200), host: env.SITE_REPLICATION_HOST || '0.0.0.0' },
		partitionThresholdMs: Number(env.SITE_REPLICATION_PARTITION_THRESHOLD_MS || 30_000),
		localSettings: [...DEFAULT_LOCAL_SETTINGS, ...list(env.SITE_REPLICATION_LOCAL_SETTINGS)],
	};
};
