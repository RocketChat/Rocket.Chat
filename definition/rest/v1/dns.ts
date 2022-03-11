import Ajv, { JSONSchemaType } from 'ajv';

const ajv = new Ajv();

type DnsResolveTxtProps = {
	url: string;
};

const dnsResolveTxtPropsSchema: JSONSchemaType<DnsResolveTxtProps> = {
	type: 'object',
	properties: {
		url: {
			type: 'string',
		},
	},
	required: ['url'],
	additionalProperties: false,
};

export const isDnsResolveTxt = ajv.compile(dnsResolveTxtPropsSchema);

type DnsResolveSrv = {
	url: string;
};

const DnsResolveSrvSchema: JSONSchemaType<DnsResolveSrv> = {
	type: 'object',
	properties: {
		url: {
			type: 'string',
		},
	},
	required: ['url'],
	additionalProperties: false,
};

export const isDnsResolveSrv = ajv.compile(DnsResolveSrvSchema);

export type DnsEndpoints = {
	'dns.resolve.srv': {
		GET: (params: DnsResolveSrv) => {
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
