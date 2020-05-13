import { callbacks } from '../../../../../app/callbacks';
import { onLicense } from '../../../license/server';

onLicense('ldap-enterprise', () => {
	callbacks.add('ldap.beforeSearchAll', (searchParams) => {
		const { options } = searchParams;

		if (!Array.isArray(options.attributes)) {
			options.attributes = options.attributes ? [options.attributes] : ['*'];
		}

		options.attributes.push('pwdAccountLockedTime');

		return searchParams;
	}, callbacks.priority.MEDIUM, 'ldap-return-attribute-AccountLockedTime');
});
