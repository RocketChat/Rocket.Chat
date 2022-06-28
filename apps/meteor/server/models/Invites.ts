import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { InvitesRaw } from './raw/Invites';

registerModel('IInvitesModel', new InvitesRaw(db, trashCollection));
