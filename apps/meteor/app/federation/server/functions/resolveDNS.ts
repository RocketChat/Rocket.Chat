import util from 'util';
import dns from 'dns';

const dnsResolveSRV = util.promisify(dns.resolveSrv);
const dnsResolveTXT = util.promisify(dns.resolveTxt);

export const resolveSRV = async (url: string): Promise<Omit<dns.SrvRecord, 'name'> & { target: dns.SrvRecord['name'] }> => {
	const [{ name, ...resolved }] = await dnsResolveSRV(url);
	return { target: name, ...resolved };
};

export const resolveTXT = async (url: string): Promise<string> => {
	const [resolved] = await dnsResolveTXT(url);

	return Array.isArray(resolved) ? resolved.join('') : resolved;
};
