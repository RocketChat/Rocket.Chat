import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import AppPermissionsList from './AppPermissionsList';

const appRoot = mockAppRoot().withTranslations('en', 'core', {
	'Apps_Permissions_user_read': 'Access user information',
	'Apps_Permissions_room_system_view-all': 'View all rooms',
});

describe('AppPermissionsList', () => {
	it('should translate a permission name with one scope', () => {
		render(<AppPermissionsList appPermissions={[{ name: 'user.read' }]} />, { wrapper: appRoot.build() });

		expect(screen.getByRole('listitem')).toHaveTextContent('Access user information');
	});

	it('should translate a permission name with nested scopes', () => {
		render(<AppPermissionsList appPermissions={[{ name: 'room.system.view-all' }]} />, { wrapper: appRoot.build() });

		expect(screen.getByRole('listitem')).toHaveTextContent('View all rooms');
	});
});
