import type { IServiceClass } from '../../../../server/sdk/types/ServiceClass';
import { ServiceClass } from '../../../../server/sdk/types/ServiceClass';
import { getConnection } from '../mongo';
import { initWatchers } from '../../../../server/modules/watchers/watchers.module';
import { api } from '../../../../server/sdk/api';
import { DatabaseWatcher } from '../../../../server/database/DatabaseWatcher';

export class StreamHub extends ServiceClass implements IServiceClass {
	protected name = 'hub';

	async created(): Promise<void> {
		const db = await getConnection({ maxPoolSize: 1 });

		const watcher = new DatabaseWatcher({ db });

		initWatchers(watcher, api.broadcast.bind(api));

		watcher.watch();
	}
}
