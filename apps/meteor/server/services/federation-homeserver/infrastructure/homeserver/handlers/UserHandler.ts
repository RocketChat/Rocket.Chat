import type { HomeserverEvent, HomeserverUser } from '@rocket.chat/core-services';
import { BaseEventHandler } from './BaseEventHandler';

export interface IUserServiceReceiver {
	onExternalUserProfileUpdate(user: HomeserverUser): Promise<void>;
}

export class UserHandler extends BaseEventHandler {
	constructor(
		private userReceiver: IUserServiceReceiver,
	) {
		super('HomeserverUserHandler');
	}

	public canHandle(event: HomeserverEvent): boolean {
		return event.type === 'user.profile.update';
	}

	public async handle(event: HomeserverEvent): Promise<void> {
		this.debug('Handling user event:', event.type, event.id);

		try {
			switch (event.type) {
				case 'user.profile.update':
					await this.handleUserProfileUpdate(event);
					break;
				default:
					this.error('Unknown user event type:', event.type);
			}
		} catch (error) {
			this.error(`Failed to handle user event ${event.type}:`, error);
			throw error;
		}
	}

	private async handleUserProfileUpdate(event: HomeserverEvent): Promise<void> {
		const user = event.data as HomeserverUser;
		
		if (!user) {
			throw new Error('Invalid user data in event');
		}

		this.log('Processing user profile update from homeserver:', user.id, user.username);
		await this.userReceiver.onExternalUserProfileUpdate(user);
	}
}