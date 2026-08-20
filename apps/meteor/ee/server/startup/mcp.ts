import { AI_LICENSE_MODULE } from '@rocket.chat/ai-search';
import { License } from '@rocket.chat/license';
import { Permissions } from '@rocket.chat/models';

await License.onLicense(AI_LICENSE_MODULE, async () => {
	await Permissions.create('access-mcp', ['admin']);
});
