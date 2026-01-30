export interface IImporterShortSelectionItem {
	all?: boolean;
	list?: string[];
}

export interface IImporterShortSelection {
	users?: IImporterShortSelectionItem;
	channels?: IImporterShortSelectionItem;
	contacts?: IImporterShortSelectionItem;
}
