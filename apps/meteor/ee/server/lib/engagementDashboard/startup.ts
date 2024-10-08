import { callbacks } from '../../../../lib/callbacks';
import { fillFirstDaysOfMessagesIfNeeded, handleMessagesDeleted, handleMessagesSent } from './messages';
import { fillFirstDaysOfUsersIfNeeded, handleUserCreated } from './users';

export const attachCallbacks = (): void => {
	callbacks.add(
		'afterSaveMessage',
		(message, { room }) => handleMessagesSent(message, { room }),
		callbacks.priority.MEDIUM,
		'engagementDashboard.afterSaveMessage',
	);
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
