export interface IImportContact {
	importIds: string[];
	_id?: string;
	name?: string;
	phones?: string[];
	emails?: string[];
	contactManager?: string;
	customFields?: Record<string, string>;
}
