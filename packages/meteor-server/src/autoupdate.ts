import { createHash } from 'node:crypto';

import { Meteor } from './meteor.ts';

/**
 * Port of the parts of meteor/autoupdate that the server side depends on.
 *
 * Rocket.Chat's MeteorService calls
 * `Meteor.server.publish_handlers.meteor_autoupdate_clientVersions.call(...)`
 * on startup to collect client versions and broadcast them to ddp-streamer,
 * which uses them to tell connected clients to reload. Dropping the Meteor
 * package means this publication has to be provided here.
 *
 * There is no Meteor client bundle to hash any more: the version is taken from
 * `AUTOUPDATE_VERSION` when set (same env var Meteor honours), otherwise from
 * the build's git commit, so it stays stable for a given deployment and changes
 * when a new build is shipped.
 */

export type AutoUpdateVersion = {
	_id: string;
	version: string;
	versionRefreshable?: string;
	versionNonRefreshable?: string;
	versionHmr: number;
	assets?: Array<{ url: string }>;
};

type WatchCallback = {
	fn: (version: AutoUpdateVersion, isNew: boolean) => void;
	filter?: string;
};

/** Port of packages/autoupdate/client_versions.js (server-side subset) */
export class ClientVersions {
	private _versions = new Map<string, AutoUpdateVersion>();

	private _watchCallbacks = new Set<WatchCallback>();

	hasVersions(): boolean {
		return this._versions.size > 0;
	}

	get(id: string): AutoUpdateVersion | undefined {
		return this._versions.get(id);
	}

	/**
	 * Adds or updates a version document and invokes registered callbacks for
	 * it. Fields are merged into an existing document, as in Meteor.
	 */
	set(id: string, fields: Partial<AutoUpdateVersion>): void {
		let version = this._versions.get(id);
		let isNew = false;

		if (version) {
			Object.assign(version, fields);
		} else {
			version = { _id: id, ...fields } as AutoUpdateVersion;
			isNew = true;
			this._versions.set(id, version);
		}

		this._watchCallbacks.forEach(({ fn, filter }) => {
			if (!filter || filter === version!._id) {
				fn(version!, isNew);
			}
		});
	}

	/**
	 * Registers a callback invoked when a version document is added or changed.
	 * The returned function removes it. Existing documents are replayed
	 * asynchronously (as Meteor does) unless `skipInitial` is set.
	 */
	watch(
		fn: (version: AutoUpdateVersion, isNew: boolean) => void,
		{ skipInitial, filter }: { skipInitial?: boolean; filter?: string } = {},
	): () => void {
		if (!skipInitial) {
			const resolved = Promise.resolve();

			this._versions.forEach((version) => {
				if (!filter || filter === version._id) {
					void resolved.then(() => fn(version, true));
				}
			});
		}

		const callback: WatchCallback = { fn, filter };
		this._watchCallbacks.add(callback);

		return () => this._watchCallbacks.delete(callback);
	}

	all(): Record<string, AutoUpdateVersion> {
		return Object.fromEntries(this._versions);
	}
}

const clientVersions = new ClientVersions();

const buildVersion = (): string => {
	if (process.env.AUTOUPDATE_VERSION) {
		return process.env.AUTOUPDATE_VERSION;
	}

	const seed = globalThis.__meteor_runtime_config__?.gitCommitHash ?? process.env.GIT_COMMIT_HASH ?? 'development';

	return createHash('sha1').update(seed).digest('hex').slice(0, 32);
};

export const Autoupdate = {
	/** Map of client architecture to version fields, as in Meteor */
	versions: {} as Record<string, AutoUpdateVersion>,

	appId: process.env.APP_ID,

	autoupdateVersion: null as string | null,

	clientVersions,

	/** Registers/updates the version document for an architecture */
	setVersion(arch: string, fields: Partial<AutoUpdateVersion>): void {
		Autoupdate.versions[arch] = { ...Autoupdate.versions[arch], ...fields, _id: arch } as AutoUpdateVersion;
		clientVersions.set(arch, Autoupdate.versions[arch]);
	},
};

// The vite build produces a single browser client; `web.browser` is the arch
// Rocket.Chat's client reports.
const version = buildVersion();
Autoupdate.autoupdateVersion = version;
Autoupdate.setVersion('web.browser', {
	version,
	versionRefreshable: version,
	versionNonRefreshable: version,
	versionHmr: 0,
});

Meteor.publish('meteor_autoupdate_clientVersions', function (this: any, appId?: string | null) {
	// Don't notify clients using a different appId, as Meteor does
	if (Autoupdate.appId && appId && Autoupdate.appId !== appId) {
		return [];
	}

	const stop = clientVersions.watch((version, isNew) => {
		(isNew ? this.added : this.changed).call(this, 'meteor_autoupdate_clientVersions', version._id, version);
	});

	this.onStop(() => stop());
	this.ready();
});
