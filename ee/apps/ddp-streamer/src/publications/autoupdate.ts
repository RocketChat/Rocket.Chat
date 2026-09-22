import type { Server } from '../Server';
import { Autoupdate } from '../lib/Autoupdate';

const collection = 'meteor_autoupdate_clientVersions';

export function registerAutoupdatePublication(server: Server): void {
	server.publish(collection, function () {
		Autoupdate.getVersions().forEach((version, arch) => {
			this.added(collection, arch, version);
		});

		const fn = (record: any): void => {
			const { _id, ...version } = record;
			this.changed(collection, _id, version);
		};

		Autoupdate.on('update', fn);

		this.onStop(() => {
			Autoupdate.removeListener('update', fn);
		});

		this.ready();
	});
}
