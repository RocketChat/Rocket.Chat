import type { IImport } from './IImport.js';

export type ImportStatus =
	| { state: 'none' }
	| {
			state: 'new' | 'loading' | 'ready' | 'importing' | 'done' | 'error' | 'canceled';
			operation: IImport;
	  };
