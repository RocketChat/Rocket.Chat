import { Statistics } from '@rocket.chat/models';

import { getMatrixFederationStatistics } from '../../../app/federation-v2/server/infrastructure/rocket-chat/statistics';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 282,
	async up() {
		await Statistics.updateMany(
			{},
			{
				$set: {
					matrixFederation: await getMatrixFederationStatistics(),
				},
			},
		);
	},
});
