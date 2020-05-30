import { hasLicense } from '../../license/client';
import { AccountBox } from '../../../../app/ui-utils/client';
import { hasAllPermission } from '../../../../app/authorization/client';
import './routes';

hasLicense('auditing').then((enabled) => {
	if (!enabled) {
		return;
	}
	require('./templates');
	require('./index.css');

	AccountBox.addItem({
		href: 'audit-home',
		name: 'Message_auditing',
		icon: 'clipboard',
		condition: () => hasAllPermission('can-audit'),
	});

	AccountBox.addItem({
		href: 'audit-log',
		name: 'Message_auditing_log',
		icon: 'clipboard',
		condition: () => hasAllPermission('can-audit-log'),
	});
}).catch((error) => {
	console.error('Error checking license.', error);
});
