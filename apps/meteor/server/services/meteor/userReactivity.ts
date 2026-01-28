import { MongoInternals } from 'meteor/mongo';

type Callbacks = {
	added(id: string, record: object): void;
	changed(id: string, record: object): void;
	removed(id: string): void;
};

export const serviceConfigCallbacks = new Set<Callbacks>();

// Stores the callbacks for the disconnection reactivity bellow
const userCallbacks = new Map();

// Overrides the native observe changes to prevent database polling and stores the callbacks
// for the users' tokens to re-implement the reactivity based on our database listeners
const { mongo } = MongoInternals.defaultRemoteCollectionDriver();
MongoInternals.Connection.prototype._observeChanges = async function (
	{
		collectionName,
		selector,
		options = {},
	}: {
		collectionName: string;
		selector: Record<string, any>;
		options?: {
			projection?: Record<string, number>;
			fields?: Record<string, number>;
		};
	},
	_ordered: boolean,
	callbacks: Callbacks,
): Promise<any> {
	// console.error('Connection.Collection.prototype._observeChanges', collectionName, selector, options);
	let cbs: Set<{ hashedToken: string; callbacks: Callbacks }>;
	let data: { hashedToken: string; callbacks: Callbacks };
	if (callbacks?.added) {
		const records = await mongo
			.rawCollection(collectionName)
			.find(selector, {
				...(options.projection || options.fields ? { projection: options.projection || options.fields } : {}),
			})
			.toArray();

		for (const { _id, ...fields } of records) {
			callbacks.added(String(_id), fields);
		}

		if (collectionName === 'users' && selector['services.resume.loginTokens.hashedToken']) {
			cbs = userCallbacks.get(selector._id) || new Set();
			data = {
				hashedToken: selector['services.resume.loginTokens.hashedToken'],
				callbacks,
			};

			cbs.add(data);
			userCallbacks.set(selector._id, cbs);
		}
	}

	if (collectionName === 'meteor_accounts_loginServiceConfiguration') {
		serviceConfigCallbacks.add(callbacks);
	}

	return {
		stop(): void {
			if (cbs) {
				cbs.delete(data);
			}
			serviceConfigCallbacks.delete(callbacks);
		},
	};
};

// Re-implement meteor's reactivity that uses observe to disconnect sessions when the token
// associated was removed
export const processOnChange = (diff: Record<string, any>, id: string): void => {
	if (!diff || !('services.resume.loginTokens' in diff)) {
		return;
	}
	const loginTokens: undefined | { hashedToken: string }[] = diff['services.resume.loginTokens'];
	const tokens = loginTokens?.map(({ hashedToken }) => hashedToken);

	const cbs = userCallbacks.get(id);
	if (cbs) {
		[...cbs]
			.filter(({ hashedToken }) => tokens === undefined || !tokens.includes(hashedToken))
			.forEach((item) => {
				item.callbacks.removed(id);
				cbs.delete(item);
			});
	}
};
