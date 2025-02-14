import type { IAuditServerUserActor, IServerEvents, ExtractDataToParams, IUser } from '@rocket.chat/core-typings';
import { ServerEvents } from '@rocket.chat/models';
import type { UpdateFilter } from 'mongodb';

const keysToObfuscate = ['authorizedClients', 'e2e', 'inviteToken', 'oauth'];

const obfuscateServices = (services: Record<string, any>): Record<string, any> => {
	return Object.fromEntries(
		Object.keys(services).map((key) => {
			// Email 2FA is okay, only tells if it's enabled
			if (key === 'email2fa') {
				return [key, services[key]];
			}
			return [key, '****'];
		}),
	);
};
export class UserChangedAuditStore {
	private originalUser: Partial<IUser> | undefined;

	private updateFilter: UpdateFilter<IUser> | undefined;

	private actor: IAuditServerUserActor;

	constructor(actor: Omit<IAuditServerUserActor, 'type'>, type: IAuditServerUserActor['type'] = 'user') {
		this.actor = { ...actor, type };
	}

	public setOriginalUser(user: Partial<IUser>) {
		this.originalUser = user;
	}

	public setUpdateFilter(updateFilter: UpdateFilter<IUser>) {
		this.updateFilter = Object.fromEntries(
			Object.entries(updateFilter).map(([key, value]) => {
				const obfuscatedValue = Object.entries(value).reduce((acc, [k, v]) => {
					if (keysToObfuscate.includes(k)) {
						return {
							...acc,
							[k]: '****',
						};
					}

					if (k === 'services') {
						return {
							...acc,
							[k]: obfuscateServices(v as Record<string, any>),
						};
					}

					return { ...acc, [k]: v };
				}, {});

				return [key, obfuscatedValue];
			}),
		);
	}

	private filterUserChangedProperties(originalUser: Partial<IUser>, updateFilter: UpdateFilter<IUser>): Partial<IUser> {
		if (Object.keys(updateFilter).length === 0) {
			return {};
		}

		const updateFilterKeys = Object.values(updateFilter).reduce((acc, current) => {
			const keys = Object.keys(current);
			if (keys.length === 0) {
				return acc;
			}
			return [...acc, ...keys];
		}, []);

		return Object.entries(originalUser).reduce((acc, [key, value]) => {
			if (!updateFilterKeys.includes(key)) {
				return acc;
			}

			if (keysToObfuscate.includes(key)) {
				return {
					...acc,
					[key]: '****',
				};
			}

			if (key === 'services') {
				const changedServices = Object.keys(updateFilter.$set?.[key] || {}).map((serviceKey) => [
					serviceKey,
					value[serviceKey as keyof typeof value],
				]);

				if (!changedServices.length) {
					return acc;
				}

				return {
					...acc,
					[key]: obfuscateServices(Object.fromEntries(changedServices) as Record<string, any>),
				};
			}

			return {
				...acc,
				[key]: value,
			};
		}, {});
	}

	private getEventData(
		originalUser: Partial<IUser>,
		updateFilter: UpdateFilter<IUser>,
	): ExtractDataToParams<IServerEvents['user.changed']> {
		const userData = this.filterUserChangedProperties(originalUser, updateFilter);

		return {
			user: { _id: originalUser._id || '', username: originalUser.username },
			user_data: userData,
			operation: updateFilter,
		};
	}

	private buildEvent(): ['user.changed', ExtractDataToParams<IServerEvents['user.changed']>, IAuditServerUserActor] {
		if (!this.updateFilter) {
			throw new Error('UserChangedAuditStore - Updater is undefined');
		}

		if (!this.originalUser) {
			throw new Error('UserChangedAuditStore - OriginalUser is undefined');
		}

		const eventData = this.getEventData(this.originalUser, this.updateFilter);

		if (Object.keys(eventData.user_data).length === 0 || Object.keys(eventData.operation).length === 0) {
			// UpdaterImpl throws an error when trying to build the filter if no changes are detected
			// so we should never get here
			throw new Error('UserChangedAuditStore - No changes detected');
		}

		return ['user.changed', eventData, this.actor];
	}

	public async commitAuditEvent() {
		const event = this.buildEvent();
		return ServerEvents.createAuditServerEvent(...event);
	}
}
