export type ExchangeEndpoints = {
	'/v1/exchange.testConnection': {
		POST: () => {
			provider: string;
			message: string;
		};
	};
	'/v1/exchange.syncMyCalendar': {
		POST: () => {
			upserted: number;
			modified: number;
			deleted: number;
		};
	};
	'/v1/exchange.syncMyContacts': {
		POST: () => {
			folders: number;
			upserted: number;
			modified: number;
			deleted: number;
			pruned: number;
		};
	};
};
