import type { ModalsInsertProps } from './ModalsInsertProps';
import type { ModalsProps } from './ModalsProps';

export type ModalsEndpoints = {
	'/v1/modals': {
		// PUT: (params: ModalsProps) => { success: boolean };
		POST: (params: ModalsInsertProps) => { success: boolean };
	};
	'/v1/modals/remove': {
		DELETE: (params: ModalsProps) => { success: boolean };
	};
	'/v1/modals/dismiss': {
		POST: (params: ModalsProps) => { success: boolean };
		DELETE: (params: ModalsProps) => { success: boolean };
	};
};
