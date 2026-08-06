import { Permissions } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

// Required to call any MCP action (`/api/v1/mcp`). Granted to `admin` by default;
// admins can grant it to other roles from the Permissions admin page.
Meteor.startup(async () => {
	await Permissions.create('access-mcp', ['admin']);
});
