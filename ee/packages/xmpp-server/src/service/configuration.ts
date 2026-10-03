export type XMPPServerConfiguration = {
	enabled: boolean;
	domain: string;
	port: number;
	tlsCert: string;
	tlsKey: string;
	mucSubdomain: string;
	domainAllowList: string[];
	presenceEnabled: boolean;
	messageIdSecret: string;
};

export const XMPP_SETTING_KEYS = [
	'XMPP_Server_Enabled',
	'XMPP_Server_Domain',
	'XMPP_Server_Port',
	'XMPP_Server_TLS_Certificate',
	'XMPP_Server_TLS_Key',
	'XMPP_Server_MUC_Subdomain',
	'XMPP_Server_Domain_Allow_List',
	'XMPP_Server_Presence_Enabled',
	'XMPP_Server_Message_Id_Secret',
] as const;

export type XMPPSettingKey = (typeof XMPP_SETTING_KEYS)[number];

export const isXMPPSettingKey = (key: string): key is XMPPSettingKey => (XMPP_SETTING_KEYS as readonly string[]).includes(key);

const parseAllowList = (raw: string): string[] =>
	raw
		.split(',')
		.map((entry) => entry.trim())
		.filter(Boolean);

/** Builds the service configuration from the `XMPP_Server_*` settings, whichever store they are read from. */
export async function readXMPPServerConfiguration(
	getSetting: (key: XMPPSettingKey) => unknown,
	hasFederationModule: boolean,
): Promise<XMPPServerConfiguration> {
	const get = async <T>(key: XMPPSettingKey, fallback: T): Promise<T> => ((await getSetting(key)) as T | undefined) ?? fallback;

	return {
		enabled: hasFederationModule && (await get('XMPP_Server_Enabled', false)),
		domain: await get('XMPP_Server_Domain', ''),
		port: await get('XMPP_Server_Port', 5269),
		tlsCert: await get('XMPP_Server_TLS_Certificate', ''),
		tlsKey: await get('XMPP_Server_TLS_Key', ''),
		mucSubdomain: await get('XMPP_Server_MUC_Subdomain', 'conference'),
		domainAllowList: parseAllowList(await get('XMPP_Server_Domain_Allow_List', '')),
		presenceEnabled: await get('XMPP_Server_Presence_Enabled', true),
		messageIdSecret: await get('XMPP_Server_Message_Id_Secret', ''),
	};
}
