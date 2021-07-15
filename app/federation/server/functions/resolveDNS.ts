import dns from 'dns';

import { Meteor } from 'meteor/meteor';

const dnsResolveSRV = Meteor.wrapAsync(dns.resolveSrv);
const dnsResolveTXT = Meteor.wrapAsync(dns.resolveTxt);

export const resolveSRV = async (url: string): Promise<Record<string, string | number>> => {
	const [resolved] = await dnsResolveSRV(url);

	// Normalize
	resolved.target = resolved.name;
	delete resolved.name;

	return resolved;
};

export const resolveTXT = async (url: string): Promise<string> => {
	const [resolved] = await dnsResolveTXT(url);

	return Array.isArray(resolved) ? resolved.join('') : resolved;
};
