export type ExchangeEndpoints = {
	'/v1/exchange.testConnection': {
		POST: () => {
			provider: string;
			message: string;
		};
	};
};
