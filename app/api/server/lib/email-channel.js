import { EmailChannel } from '../../../models/server/raw';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';

export async function find({ uid }) {
	console.log(uid, 'create permission');
	if (!await hasPermissionAsync(uid, 'manage-email-channels')) {
		throw new Error('error-not-allowed');
	}
	return EmailChannel.find().toArray();
}
