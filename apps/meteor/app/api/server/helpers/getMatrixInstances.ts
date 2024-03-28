import { makeFunction } from '@rocket.chat/patch-coordinator';
import type { BrokerNode } from 'moleculer';

export const getMatrixInstances = makeFunction(async (): Promise<BrokerNode[]> => []);
