import type { IMessageSearchProvider, IRoom, IUser } from '@rocket.chat/core-typings';

import type { ISearchResult } from '../../../../../../server/lib/search/model/ISearchResult';

declare module '@rocket.chat/ddp-client' {
	interface ServerMethods {
		'rocketchatSearch.getProvider'(): IMessageSearchProvider | undefined;
		'rocketchatSearch.search'(text: string, context: { uid?: IUser['_id']; rid: IRoom['_id'] }, payload: unknown): Promise<ISearchResult>;
	}
}
