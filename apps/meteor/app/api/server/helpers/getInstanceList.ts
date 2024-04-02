import { makeFunction } from '@rocket.chat/patch-coordinator';
import type { BrokerNode } from 'moleculer';

export const getInstanceList = makeFunction(async (): Promise<BrokerNode[]> => []);
