import type { ISetting } from '../ISetting';

export interface ISearchProvider {
	key: string;
	description: string;
	icon: string;
	resultTemplate: string;
	supportsSuggestions: boolean;
	suggestionItemTemplate?: string;
	settings: Record<ISetting['_id'], ISetting['value']>;
}
