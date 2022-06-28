import type { ModalsInsertProps } from './ModalsInsertProps';
import type { ModalsProps } from './ModalsProps';

export type ModalsEndpoints = {
	'/v1/modals': {
		// PUT: (params: ModalsProps) => { success: boolean };
		POST: (params: ModalsInsertProps) => void;
	};
	'/v1/modals/remove': {
		DELETE: (params: ModalsProps) => void;
	};
	'/v1/modals/dismiss': {
		POST: (params: ModalsProps) => void;
		DELETE: (params: ModalsProps) => void;
	};
};
