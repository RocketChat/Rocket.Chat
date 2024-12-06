import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { MatrixBridgedUser, Users } from '@rocket.chat/models';

import { notifyOnUserChangeById } from '../../../app/lib/server/lib/notifyListener';
import type { IFederationBridge } from './domain/IFederationBridge';
import type { RocketChatSettingsAdapter } from './infrastructure/rocket-chat/adapters/Settings';

/*
 * An intent is a chain of actions. Once you create an intent for a user, any federated action may be run, and intent takes care of anything that is required.
 *
 * FederationIntent bridges the gap between Rocket.Chat's processes and Matrix's.
 * An intent **owns** its resources. I.e. if an action fails, it reverts all internals resources that it created.
 *
 * intents are asynchronous in nature, they don't block completions especially.
 *
 * Intents are a one time use. Once you start an intent, make sure you perform the largest action on it, so it doesn't leave things in a bad state.
 *
 * Intents are supposed to be self-healing and/or repeatable. If a reversal fails, performing a similar intent path should heal the state if the failing condition is fixed.
 */
export class FederationIntent {
	private readonly bridge!: IFederationBridge;

	private readonly settings!: RocketChatSettingsAdapter;

	private reversals: Array<() => Promise<void>> = [];

	private completions: Array<() => Promise<void>> = [];

	private _done = false;

	private constructor(
		private readonly _internalUser: Partial<IUser>,
		opts: {
			bridge: IFederationBridge;
			settings: RocketChatSettingsAdapter;
		},
	) {
		this.bridge = opts.bridge;
		this.settings = opts.settings;
	}

	static create(
		_internalUser: Partial<IUser>,
		opts: {
			bridge: IFederationBridge;
			settings: RocketChatSettingsAdapter;
		},
	): FederationIntent {
		const intent = new FederationIntent(_internalUser, { bridge: opts.bridge, settings: opts.settings });

		const intentProxy = new Proxy(intent, {
			get(_target, p: keyof typeof intent) {
				const prop = intent[p];

				if (typeof prop === 'function') {
					const fn: typeof prop = async (...args: Parameters<typeof prop>) => {
						if (!intent.active()) {
							throw new Error('intent has fulfilled its purpose, create a new intent to follow');
						}

						const _fn = prop.bind(intent);

						try {
							if (args.length === 0) {
								// @ts-ignore-error if this fails that's ok
								await _fn();
							} else {
								await _fn(...args);
							}
						} catch (err) {
							// reverse everything ran locally until the point intent failed
							for await (const reversalFn of intent.reversals) {
								await reversalFn().catch(console.error);
							}

							return;
						} finally {
							intent.done();
						}

						intent.complete();
					};

					return fn;
				}

				return prop;
			},
		});

		return intentProxy;
	}

	private done() {
		this._done = true;
	}

	private complete() {
		this.completions.reduce((lastPromise, completeFn) => lastPromise.then(() => completeFn()), Promise.resolve()).catch(console.error);
	}

	public active() {
		return !this._done;
	}

	public async ensureRegisteredLocally(): Promise<void> {
		if (this._internalUser._id) {
			// User is ready, either a prepped user object was used to create the intent,
			// in which case intent does not own the user and so shouldn't reverse its existence.
			// Or, this function was called already, likely a bug.
			return;
		}

		const { insertedId } = await Users.create(this._internalUser);

		this._internalUser._id = insertedId;

		this.reversals.push(async () => {
			if (!this._internalUser._id) {
				throw new Error(`user id unset, unknown reason, something is wrong ${JSON.stringify(this._internalUser)}`);
			}

			await Users.removeById(this._internalUser._id);
			void notifyOnUserChangeById({ id: this._internalUser._id, clientAction: 'removed' });
		});

		this.completions.push(async () => {
			void notifyOnUserChangeById({ id: this._internalUser._id as string, clientAction: 'inserted' });
		});
	}

	private get matrixUsername(): string {
		return `@${this._internalUser.username as string}:${this.settings.getHomeServerDomain()}`;
	}

	public async ensureRegistered(): Promise<void> {
		await this.ensureRegisteredLocally();

		const externalUser = await MatrixBridgedUser.getBridgedUserByLocalId(this._internalUser._id as string);
		if (externalUser) {
			const externalUserExists = await this.bridge.getUserProfileInformation(externalUser.mui);
			if (externalUserExists) {
				return;
			}
		} else {
			const externalUser = await this.bridge.getUserProfileInformation(this.matrixUsername);
			if (externalUser) {
				await MatrixBridgedUser.createOrUpdateByLocalId(
					this._internalUser._id as string,
					this.matrixUsername,
					false,
					this.settings.getHomeServerDomain(),
				);

				return;
			}
		}

		// ignore the fact that our db contains a reference to a user that apparently doesn't exist
		// this could mean one thing and one thing only, either we rushed into filling our dataset
		// or homeserver was reset. we move on to re-provisioning the user here.

		const externalUserId = await this.bridge.createUser(
			this._internalUser.username as string,
			this._internalUser.name as string,
			this.settings.getHomeServerDomain(),
			this._internalUser.avatarUrl,
		);

		this.completions.push(async () => {
			await Users.updateOne({ _id: this._internalUser._id }, { $set: { 'matrix.ready': true } });
			void notifyOnUserChangeById({ clientAction: 'updated', id: this._internalUser._id as string });
		});

		// this happens after homeserver user_create.
		// thus no need to reverse this action, in case the other fails we don't run it either.
		// in case this linking fails, ideally another intent makes sure this is filled.
		await MatrixBridgedUser.createOrUpdateByLocalId(
			this._internalUser._id as string,
			externalUserId,
			false,
			this.settings.getHomeServerDomain(),
		);
	}

	public async createDirectRoom() {
	}
}
