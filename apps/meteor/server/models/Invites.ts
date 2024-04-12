import { registerModel } from '@rocket.chat/models';

import { InvitesRaw } from './raw/Invites';

registerModel('IInvitesModel', new InvitesRaw());
