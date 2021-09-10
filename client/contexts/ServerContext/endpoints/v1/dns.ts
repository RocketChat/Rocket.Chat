export type DnsEndpoints = {
	'dns.resolve.srv': {
		GET: (params: { url: string }) => {
			resolved: Record<string, string | number>;
		};
	};
	'dns.resolve.txt': {
		GET: (params: { url: string }) => {
			resolved: Record<string, string | number>;
		};
	};
};
