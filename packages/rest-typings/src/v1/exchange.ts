export type ExchangeEndpoints = {
	'/v1/exchange.testConnection': {
		POST: () => {
			provider: string;
			message: string;
			success: boolean;
		};
	};
	'/v1/exchange.syncMyCalendar': {
		POST: () => {
			upserted: number;
			modified: number;
			deleted: number;
			success: boolean;
		};
	};
};
