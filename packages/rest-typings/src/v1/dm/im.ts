import type { ISubscription, IUploadWithUser, IUser, IRoom } from '@rocket.chat/core-typings';

import type { DmCreateProps } from './DmCreateProps';
import type { DmFileProps } from './DmFileProps';
import type { DmMemberProps } from './DmMembersProps';
import type { PaginatedResult } from '../../helpers/PaginatedResult';

type DmKickProps = {
	roomId: string;
};

export type ImEndpoints = {
	// Type-migration pending: the ExtractRoutesFromAPI emit for this route is
	// weaker than this declaration (see the Omit in the meteor augmentation).
	'/v1/im.files': {
		GET: (params: DmFileProps) => PaginatedResult<{
			files: IUploadWithUser[];
		}>;
	};
	'/v1/im.members': {
		GET: (params: DmMemberProps) => PaginatedResult<{
			members: (Pick<IUser, '_id' | 'status' | 'name' | 'username' | 'utcOffset'> & {
				subscription: Pick<ISubscription, '_id' | 'status' | 'ts' | 'roles'>;
			})[];
		}>;
	};
	// Kept canonical here: the ddp-client legacy SDK consumes this route
	// without seeing the meteor module augmentation.
	'/v1/im.create': {
		POST: (params: DmCreateProps) => {
			room: IRoom & { rid: IRoom['_id'] };
		};
	};
	'/v1/im.kick': {
		POST: (params: DmKickProps) => void;
	};
};
