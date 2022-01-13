import dns from 'dns';

const { resolveSrv: dnsResolveSRV, resolveTxt: dnsResolveTXT } = dns.promises;

export const resolveSRV = async (url: string): Promise<Omit<dns.SrvRecord, 'name'> & { target: dns.SrvRecord['name'] }> => {
	try {
		const [{ name, ...resolved }] = await dnsResolveSRV(url);
		return { target: name, ...resolved };
	} catch (error: any) {
		throw error;
	}
};

export const resolveTXT = async (url: string): Promise<string> => {
	try {
		const [resolved] = await dnsResolveTXT(url);

		return Array.isArray(resolved) ? resolved.join('') : resolved;
	} catch (error: any) {
		throw error;
	}
};
