import { UpdateWriteOpResult } from 'mongodb';
import { ModalsProps } from './ModalsProps';

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/interface-name-prefix
	interface Endpoints {
		'/v1/modals/me': {
			PUT: (params: ModalsProps) => Pick<UpdateWriteOpResult, 'modifiedCount' | 'matchedCount'>;
			DELETE: (params: ModalsProps) => Pick<UpdateWriteOpResult, 'modifiedCount' | 'matchedCount'>;
		};
	}
}
