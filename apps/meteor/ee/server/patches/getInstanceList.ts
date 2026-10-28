import { getInstanceList } from '../../../server/api/lib/getInstanceList';
import { Instance } from '../sdk';

getInstanceList.patch(() => Instance.getInstances());
