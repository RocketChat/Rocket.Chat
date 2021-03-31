import { IRoom } from '../../../../../../definition/IRoom';

export type AutocompleteAvailableForTeamsEndpoint = {
	GET: (params: { selector: string }) => { items: IRoom[] };
};
