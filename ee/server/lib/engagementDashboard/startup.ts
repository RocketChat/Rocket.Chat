import { fillFirstDaysOfMessagesIfNeeded, handleMessagesDeleted, handleMessagesSent } from './messages';
import { fillFirstDaysOfUsersIfNeeded, handleUserCreated } from './users';
import { callbacks } from '../../../../lib/callbacks';
import { Permissions } from '../../../../app/models/server/raw';

export const attachCallbacks = (): void => {
	callbacks.add('afterSaveMessage', handleMessagesSent, callbacks.priority.MEDIUM, 'engagementDashboard.afterSaveMessage');
	callbacks.add('afterDeleteMessage', handleMessagesDeleted, callbacks.priority.MEDIUM, 'engagementDashboard.afterDeleteMessage');
	callbacks.add('afterCreateUser', handleUserCreated, callbacks.priority.MEDIUM, 'engagementDashboard.afterCreateUser');
};

export const detachCallbacks = (): void => {
	callbacks.remove('afterSaveMessage', 'engagementDashboard.afterSaveMessage');
	callbacks.remove('afterDeleteMessage', 'engagementDashboard.afterDeleteMessage');
	callbacks.remove('afterCreateUser', 'engagementDashboard.afterCreateUser');
};

export const prepareAnalytics = async (): Promise<void> => {
	const now = new Date();
	await Promise.all([fillFirstDaysOfUsersIfNeeded(now), fillFirstDaysOfMessagesIfNeeded(now)]);
};

export const prepareAuthorization = async (): Promise<void> => {
	Permissions.create('view-engagement-dashboard', ['admin']);
};
