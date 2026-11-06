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
	'/v1/exchange.syncMyContacts': {
		POST: () => {
			folders: number;
			upserted: number;
			modified: number;
			deleted: number;
			pruned: number;
			success: boolean;
		};
	};
};
