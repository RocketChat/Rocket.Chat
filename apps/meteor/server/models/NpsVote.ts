import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { NpsVoteRaw } from './raw/NpsVote';

const col = db.collection(`${prefix}nps_vote`);
registerModel('INpsVoteModel', new NpsVoteRaw(col, trashCollection));
