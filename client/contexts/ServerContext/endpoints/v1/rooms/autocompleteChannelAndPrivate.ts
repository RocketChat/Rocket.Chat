import { IRoom } from '../../../../../../definition/IRoom';

export type AutocompleteChannelAndPrivateEndpoint = {
	GET: (params: { selector: string }) => { items: IRoom[] };
};
