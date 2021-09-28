import { IInstance } from '../../definition/IInstance';
import { call } from '../lib/utils/call';

export const getServerInstances = (): Promise<IInstance[]> => call('instances/get');
