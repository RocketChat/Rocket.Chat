import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import AppInstallModal from './AppInstallModal';

const appRoot = mockAppRoot().withTranslations('en', 'core', {
	Enable_of_limit_apps_currently_enabled_exceeded:
		'{{enabled}} of {{limit}} {{context}} apps currently enabled. {{appName}} will be disabled.',
});

describe('AppInstallModal', () => {
	it('should not show a raw placeholder when the app limit is exceeded', () => {
		render(
			<AppInstallModal
				enabled={6}
				limit={5}
				appName='Poll'
				handleClose={jest.fn()}
				handleConfirm={jest.fn()}
				handleEnableUnlimitedApps={jest.fn()}
			/>,
			{ wrapper: appRoot.build() },
		);

		expect(screen.getByText(/6 of 5 apps currently enabled/)).toBeInTheDocument();
		expect(screen.queryByText(/\{\{context\}\}/)).not.toBeInTheDocument();
	});
});
