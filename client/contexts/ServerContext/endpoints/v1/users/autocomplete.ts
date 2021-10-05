import { IUser } from '../../../../../../definition/IUser';

export type AutocompleteEndpoint = {
	GET: (params: { selector: string }) => { items: IUser[] };
};
