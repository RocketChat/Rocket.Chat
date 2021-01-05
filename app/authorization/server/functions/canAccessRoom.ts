import { Promise } from 'meteor/promise';

import { Authorization } from '../../../../server/sdk';
import { IAuthorization } from '../../../../server/sdk/types/IAuthorization';

export const canAccessRoomAsync = Authorization.canAccessRoom;

export const canAccessRoom = (...args: Parameters<IAuthorization['canAccessRoom']>): boolean => Promise.await(canAccessRoomAsync(...args));
