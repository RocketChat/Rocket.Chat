import '../hooks/auth/callback';
import './audit';
import './deviceManagement';
import './engagementDashboard';
import './maxRoomsPerGuest';
import './services';
import './readReceiptsArchive';
import './mcp';
import { api } from '@rocket.chat/core-services';

import { isRunningMs } from '../../../server/lib/isRunningMs';
import { SystemLogger } from '../../../server/lib/logger/system';
import { getEncryptionWarning } from '../local-services/instance/getEncryption';

export const registerEEBroker = async (): Promise<void> => {
	// only starts network broker if running in micro services mode
	if (isRunningMs()) {
		const encryptionWarning = getEncryptionWarning(process.env.MOLECULER_ENCRYPTION_SECRET, 'microservices');
		if (encryptionWarning) {
			SystemLogger.warn(encryptionWarning);
		}

		const { startBroker } = await import('@rocket.chat/network-broker');

		api.setBroker(startBroker());
		await api.start();
	} else {
		require('./presence');
	}
};
