import { PatchCoordinator } from '@rocket.chat/patch-coordinator';
import type { BrokerNode } from 'moleculer';

export const getMatrixInstances = PatchCoordinator.makeFunction(async (): Promise<BrokerNode[]> => []);
