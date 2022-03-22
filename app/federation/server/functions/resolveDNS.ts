import dns from 'dns';

const { resolveSrv: dnsResolveSRV, resolveTxt: dnsResolveTXT } = dns.promises;

export const resolveSRV = async (url: string): Promise<Omit<dns.SrvRecord, 'name'> & { target: dns.SrvRecord['name'] }> => {
	const [{ name, ...resolved }] = await dnsResolveSRV(url);
	return { target: name, ...resolved };
};

export const resolveTXT = async (url: string): Promise<string> => {
	const [resolved] = await dnsResolveTXT(url);

	return Array.isArray(resolved) ? resolved.join('') : resolved;
};
