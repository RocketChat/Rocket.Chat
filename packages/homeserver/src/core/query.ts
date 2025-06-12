// https://spec.matrix.org/v1.10/server-server-api/#post_matrixkeyv2query

export type KeyID = string;

export type ServerName = string;

export type V2KeyQueryCriteria = {
	minimum_valid_until_ts: number;
};

export interface V2KeyQueryBody {
	server_keys: Record<ServerName, Record<KeyID, V2KeyQueryCriteria>>;
}

export interface V2KeyQueryResponse {
	server_keys: {
		old_verify_keys: Record<
			string,
			{
				expired_ts: number;
				key: string;
			}
		>;
		server_name: string;
		signatures: Record<string, Record<string, string>>;
		valid_until_ts: number;
		verify_keys: Record<
			string,
			{
				key: string;
			}
		>;
	}[];
}
declare module './endpoints' {
	interface Endpoints {
		'/v2/query': {
			POST: {
				description: 'Query for keys from multiple servers in a batch format. The receiving (notary) server must sign the keys returned by the queried servers.';
				auth: false;
				rateLimit: false;
				body: V2KeyQueryBody;
				response: V2KeyQueryResponse;
			};
		};
		'/v2/query/:serverName': {
			GET: {
				description: 'Query for keys from a single server. The receiving (notary) server must sign the keys returned by the queried server.';
				auth: false;
				rateLimit: false;
				query: V2KeyQueryCriteria;
				response: V2KeyQueryResponse;
			};
		};
	}
}
