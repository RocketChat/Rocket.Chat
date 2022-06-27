import type { ModalsInsertProps } from './ModalsInsertProps';
import type { ModalsProps } from './ModalsProps';

export type ModalsEndpoints = {
	'/v1/modals': {
		// PUT: (params: ModalsProps) => { success: boolean };
		POST: (params: ModalsInsertProps) => { success: boolean };
		DELETE: (params: ModalsProps) => { success: boolean };
	};
};
