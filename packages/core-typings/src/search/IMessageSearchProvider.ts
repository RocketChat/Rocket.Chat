export interface IMessageSearchProvider {
	key: string;
	description: string;
	icon: string;
	resultTemplate: string;
	supportsSuggestions: boolean;
	suggestionItemTemplate?: string;
	settings: { GlobalSearchEnabled: boolean } & { PageSize: number };
}
