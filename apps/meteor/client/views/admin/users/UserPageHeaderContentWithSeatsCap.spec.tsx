import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';

import UserPageHeaderContent from './UserPageHeaderContentWithSeatsCap';

it('should render "Associate Extension" button when VoIP_TeamCollab_Enabled setting is enabled', async () => {
	render(<UserPageHeaderContent activeUsers={1} maxActiveUsers={1} isSeatsCapExceeded={false} />, {
		legacyRoot: true,
		wrapper: mockAppRoot().withJohnDoe().withSetting('VoIP_TeamCollab_Enabled', true).build(),
	});

	expect(screen.getByRole('button', { name: 'Assign_extension' })).toBeEnabled();
});

it('should not render "Associate Extension" button when VoIP_TeamCollab_Enabled setting is disabled', async () => {
	render(<UserPageHeaderContent activeUsers={1} maxActiveUsers={1} isSeatsCapExceeded={false} />, {
		legacyRoot: true,
		wrapper: mockAppRoot().withJohnDoe().withSetting('VoIP_TeamCollab_Enabled', false).build(),
	});

	expect(screen.queryByRole('button', { name: 'Assign_extension' })).not.toBeInTheDocument();
});
