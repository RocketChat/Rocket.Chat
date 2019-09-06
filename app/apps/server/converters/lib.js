import mem from 'mem';

import { Users } from '../../../models';

export const findUser = mem((uid) => Users.findOneById(uid), { maxAge: 10000 });
