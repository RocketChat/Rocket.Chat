import React, { useMemo } from 'react';

import { APIClient } from '../../../app/utils/client';
import { ClientLogger } from '../../../lib/ClientLogger';
import { useVoipUser } from '../../contexts/OmnichannelContext';
import VoIPLayout from './VoIPLayout';

const apiTest = async (logger: ClientLogger): Promise<void> => {
	try {
		logger.info('Executing voipServerConfig.callServer');
		const output = await APIClient.v1.post(
			'voipServerConfig.callServer',
			{},
			{
				host: 'omni-asterisk.dev.rocket.chat',
				websocketPort: 443,
				serverName: 'OmniAsterisk',
				websocketPath: 'wss://omni-asterisk.dev.rocket.chat/ws',
			},
		);
		logger.info('voipServerConfig.callServer output = ', JSON.stringify(output));
	} catch (error) {
		logger.error(`error ${error} in API voipServerConfig.callServer`);
	}
	try {
		logger.info('Executing voipServerConfig.management');
		const output = await APIClient.v1.post(
			'voipServerConfig.management',
			{},
			{
				host: 'omni-asterisk.dev.rocket.chat',
				port: 5038,
				serverName: 'OmniAsterisk',
				username: 'amol',
				password: '1234',
			},
		);
		logger.info('voipServerConfig.management output = ', JSON.stringify(output));
	} catch (error) {
		logger.error(`error ${error} in API voipServerConfig.management`);
	}

	try {
		logger.info('Executing connector.getVersion');
		const list = await APIClient.v1.get('connector.getVersion');
		logger.info('connector.getVersion output = ', JSON.stringify(list));
	} catch (error) {
		logger.error(`error ${error} in API connector.getVersion`);
	}
	try {
		logger.info('Executing voipServerConfig.management');
		const output = await APIClient.v1.get('voipServerConfig.management');
		logger.info('voipServerConfig.management output = ', JSON.stringify(output));
	} catch (error) {
		logger.error(`error ${error} in API voipServerConfig.management`);
	}
	try {
		logger.info('Executing voipServerConfig.callServer');
		const output = await APIClient.v1.get('voipServerConfig.callServer');
		logger.info('voipServerConfig.callServer output = ', JSON.stringify(output));
	} catch (error) {
		logger.error(`error ${error} in API voipServerConfig.callServer`);
	}

	try {
		logger.info('Executing queues.getSummary');
		const list = await APIClient.v1.get('voip/queues.getSummary');
		logger.info('queues.getSummary output = ', JSON.stringify(list));
	} catch (error) {
		logger.error(`error ${error} in API queues.getSummary`);
	}

	try {
		logger.info('Executing queues.getQueuedCallsForThisExtension');
		const list = await APIClient.v1.get('voip/queues.getQueuedCallsForThisExtension', {
			extension: '80000',
		});
		logger.info('queues.getQueuedCallsForThisExtension output = ', JSON.stringify(list));
	} catch (error) {
		logger.error(`error ${error} in API queues.getQueuedCallsForThisExtension`);
	}

	try {
		logger.info('Executing connector.extension.list');
		const list = await APIClient.v1.get('connector.extension.list');
		logger.info('connector.extension.list output = ', JSON.stringify(list));
	} catch (error) {
		logger.error(`error ${error} in API onnector.extension.list`);
	}

	try {
		logger.info('Executing connector.extension.getDetails');
		const list = await APIClient.v1.get('connector.extension.getDetails', {
			extension: '80000',
		});
		logger.info('connector.extension.getDetails output = ', JSON.stringify(list));
	} catch (error) {
		logger.error(`error ${error} in API connector.extension.getDetails`);
	}

	try {
		const userIdentity = await APIClient.v1.get('connector.extension.getRegistrationInfo', {
			extension: '80000',
		});
		logger.info('list = ', JSON.stringify(userIdentity));
	} catch (error) {
		logger.error(`error ${error} in API connector.extension.getRegistrationInfo`);
	}
};

function VoIPRouter(): React.ReactElement {
	const voipUser = useVoipUser();

	const logger = useMemo(() => new ClientLogger('VoIPLayout'), []);

	if (!voipUser) {
		return <div>loading{apiTest(logger) && null}</div>; // TODO: :)
	}
	return <VoIPLayout voipUser={voipUser} />;
}
export default VoIPRouter;
