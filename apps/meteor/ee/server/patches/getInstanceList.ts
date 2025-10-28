import { getInstanceList } from '../../../app/api/server/helpers/getInstanceList';
import { Instance } from '../sdk';

getInstanceList.patch(() => Instance.getInstances());
