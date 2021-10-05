import { UsersSessions } from 'meteor/konecty:user-presence';

import { Base } from './_Base';

export class UsersSessionsModel extends Base {}

export default new UsersSessionsModel(UsersSessions, { preventSetUpdatedAt: true });
