export interface IImportProgress {
	key: string;
	name: string;
	step: string;
	count: {
		completed: number;
		total: number;
	};
}
