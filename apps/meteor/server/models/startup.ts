import { registerModel } from '@rocket.chat/models';
import { MongoInternals } from 'meteor/mongo';

import { trash } from '../../app/models/server/models/_BaseDb';
import { Integrations } from './integrations/model';

const { db } = MongoInternals.defaultRemoteCollectionDriver().mongo;
const prefix = 'rocketchat_';

const trashCollection = trash.rawCollection();

registerModel('integrations', new Integrations(db.collection(`${prefix}integrations`), trashCollection));
