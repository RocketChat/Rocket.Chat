import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { InvitesRaw } from './raw/Invites';

registerModel('IInvitesModel', new InvitesRaw(db));
