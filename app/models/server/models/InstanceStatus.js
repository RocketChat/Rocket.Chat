import { InstanceStatus } from 'meteor/konecty:multiple-instances-status';

import { Base } from './_Base';

export class InstanceStatusModel extends Base {}

export default new InstanceStatusModel(InstanceStatus.getCollection(), { preventSetUpdatedAt: true });
