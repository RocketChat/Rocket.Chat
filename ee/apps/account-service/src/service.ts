import { api } from '@rocket.chat/core-services';
import { Logger } from '@rocket.chat/logger';
import type { Document } from 'mongodb';
import polka from 'polka';

import { registerServiceModels } from '../../../../apps/meteor/ee/server/lib/registerServiceModels';
import { Collections, getCollection, getConnection } from '../../../../apps/meteor/ee/server/services/mongo';
import { broker } from '../../../../apps/meteor/ee/server/startup/broker';

const PORT = process.env.PORT || 3033;

(async () => {
    try {
        const db = await getConnection();
        const trash = await getCollection<Document>(Collections.Trash);

        registerServiceModels(db, trash);

        api.setBroker(broker);

        // Import service after models are registered
        const { QueueWorker } = await import('@rocket.chat/omnichannel-services');
        api.registerService(new QueueWorker(db, Logger));

        await api.start();

        polka()
            .get('/health', async function (_req, res) {
                try {
                    await api.nodeList();
                    res.end('ok');
                } catch (err) {
                    Logger.error('Service not healthy', err);
                    res.status(500).send('not healthy');
                }
            })
            .listen(PORT, () => {
                Logger.info(`Server listening on port ${PORT}`);
            });

    } catch (error) {
        Logger.error('An error occurred during startup:', error);
        // Handle the error gracefully, e.g., by exiting the process
        process.exit(1);
    }
})();
