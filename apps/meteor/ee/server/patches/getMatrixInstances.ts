import { getMatrixInstances } from '../../../app/api/server/helpers/getMatrixInstances';
import { Instance } from '../sdk';

getMatrixInstances.patch(() => Instance.getInstances());
