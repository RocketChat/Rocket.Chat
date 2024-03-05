import { PatchCoordinator } from '@rocket.chat/patch-coordinator';

import { getMatrixInstances } from '../../../app/api/server/helpers/getMatrixInstances';
import { Instance } from '../sdk';

PatchCoordinator.addPatch(getMatrixInstances, () => Instance.getInstances());
