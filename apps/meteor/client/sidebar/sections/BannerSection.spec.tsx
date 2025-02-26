import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import BannerSection from './BannerSection';

// TODO: test presence banner
describe('Sidebar -> BannerSection -> Airgapped restriction', () => {
	it('Should render null if restricted and not admin', () => {
		render(<BannerSection />, {
			wrapper: mockAppRoot()
				.withJohnDoe({ roles: ['user'] })
				.withSetting('Cloud_Workspace_AirGapped_Restrictions_Remaining_Days', 0)
				.build(),
		});

		expect(screen.queryByText('air-gapped', { exact: false })).not.toBeInTheDocument();
	});

	it('Should render null if admin and not restricted or warning', () => {
		render(<BannerSection />, {
			wrapper: mockAppRoot().withJohnDoe().withSetting('Cloud_Workspace_AirGapped_Restrictions_Remaining_Days', 8).build(),
		});

		expect(screen.queryByText('air-gapped', { exact: false })).not.toBeInTheDocument();
	});

	it('Should render warning message if admin and warning phase', () => {
		render(<BannerSection />, {
			wrapper: mockAppRoot()
				.withJohnDoe()
				.withRole('admin')
				.withSetting('Cloud_Workspace_AirGapped_Restrictions_Remaining_Days', 7)
				.build(),
		});

		expect(screen.getByText('will enter read-only', { exact: false })).toBeInTheDocument();
	});

	it('Should render restriction message if admin and restricted phase', () => {
		render(<BannerSection />, {
			wrapper: mockAppRoot()
				.withJohnDoe()
				.withRole('admin')
				.withSetting('Cloud_Workspace_AirGapped_Restrictions_Remaining_Days', 0)
				.build(),
		});

		expect(screen.getByText('is in read-only', { exact: false })).toBeInTheDocument();
	});

	it('Should render restriction message instead of another banner', () => {
		render(<BannerSection />, {
			wrapper: mockAppRoot()
				.withJohnDoe()
				.withRole('admin')
				.withSetting('Cloud_Workspace_AirGapped_Restrictions_Remaining_Days', 0)
				.withSetting('Presence_broadcast_disabled', true)
				.build(),
		});

		expect(screen.getByText('is in read-only', { exact: false })).toBeInTheDocument();
	});
});
