import { APIClient } from '../../app/utils/client';
import { IStats } from '../../definition/IStats';

export const getServerStatistics = (): Promise<IStats> =>
	APIClient.v1.get('statistics', { refresh: true });
