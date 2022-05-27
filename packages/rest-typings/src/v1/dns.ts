import Ajv from 'ajv';

const ajv = new Ajv();

type DnsResolveTxtProps = {
	url: string;
};

const dnsResolveTxtPropsSchema = {
	type: 'object',
	properties: {
		url: {
			type: 'string',
		},
	},
	required: ['url'],
	additionalProperties: false,
};

export const isDnsResolveTxtProps = ajv.compile(dnsResolveTxtPropsSchema);

type DnsResolveSrvProps = {
	url: string;
};

const DnsResolveSrvSchema = {
	type: 'object',
	properties: {
		url: {
			type: 'string',
		},
	},
	required: ['url'],
	additionalProperties: false,
};

export const isDnsResolveSrvProps = ajv.compile(DnsResolveSrvSchema);

export type DnsEndpoints = {
	'dns.resolve.srv': {
		GET: (params: DnsResolveSrvProps) => {
			resolved: Record<string, string | number>;
		};
	};
	'dns.resolve.txt': {
		POST: (params: DnsResolveTxtProps) => {
			resolved: string;
			// resolved: Record<string, string | number>;
		};
	};
};
