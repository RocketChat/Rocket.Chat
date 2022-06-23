import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { NpsVoteRaw } from './raw/NpsVote';

registerModel('INpsVoteModel', new NpsVoteRaw(db, trashCollection));
