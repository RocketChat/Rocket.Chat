import { IRoom } from '../../../../../../definition/IRoom';

export type AutocompleteAvailableForTeamsEndpoint = {
	GET: (params: { name: string }) => { items: IRoom[] };
};
