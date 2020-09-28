import { hasPermission } from '../../../../app/authorization';
import { settings } from '../../../../app/settings';
import notifications from '../../../../app/notifications/server/lib/Notifications';

notifications.streamCannedResponses.allowRead(function() {
	return this.userId && settings.get('Canned_Responses_Enable') && hasPermission(this.userId, 'view-canned-responses');
});
