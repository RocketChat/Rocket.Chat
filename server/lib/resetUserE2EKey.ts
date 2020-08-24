import { Users, Subscriptions } from '../../app/models/server';

export function resetUserE2EEncriptionKey(uid: string): boolean {
	Users.resetE2EKey(uid);
	Subscriptions.resetUserE2EKey(uid);

	// Force the user to logout, so that the keys can be generated again
	Users.removeResumeService(uid);

	return true;
}
