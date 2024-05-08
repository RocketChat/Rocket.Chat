import { registerModel } from '@rocket.chat/models';

import { NpsVoteRaw } from './raw/NpsVote';

registerModel('INpsVoteModel', new NpsVoteRaw());
