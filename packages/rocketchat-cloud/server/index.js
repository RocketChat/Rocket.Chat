import './methods';
import { RocketChatCloudInternalApi } from './webApi';

if (RocketChat.models && RocketChat.models.Permissions) {
	RocketChat.models.Permissions.createOrUpdate('manage-cloud', ['admin']);
}

new RocketChatCloudInternalApi();
