export interface IImporterSelectionContact {
	id: string;
	name: string;
	emails: string[];
	phones: string[];
	do_import: boolean;
}

export type IImporterSelectionContactIdentifier = Pick<IImporterSelectionContact, 'id' | 'do_import'>;

export type IImporterSelectionContactOrIdentifier<WithData extends boolean = true> = WithData extends true
	? IImporterSelectionContact
	: IImporterSelectionContactIdentifier;
