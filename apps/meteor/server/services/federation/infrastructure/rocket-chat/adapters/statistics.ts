import { settings } from '../../../../../../app/settings/server';

interface IFederationStatistics {
	enabled: boolean;
}

export const getMatrixFederationStatistics = async (): Promise<IFederationStatistics> => {
	return {
		enabled: settings.get('Federation_Matrix_enabled'),
	};
};
