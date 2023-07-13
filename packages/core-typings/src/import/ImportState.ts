import type { IImport } from './IImport';

export type ImportState = 'none' | 'new' | 'loading' | 'ready' | 'importing' | 'done' | 'error' | 'canceled';

export type ImportStatus =
	| { state: 'none' }
	| {
			state: ImportState;
			operation: IImport;
	  };
