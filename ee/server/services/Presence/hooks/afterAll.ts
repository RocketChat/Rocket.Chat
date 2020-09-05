import { updateUserPresence } from '../actions/updateUserPresence';

export async function afterAll(uid: string): Promise<void> {
	updateUserPresence(uid);
}
