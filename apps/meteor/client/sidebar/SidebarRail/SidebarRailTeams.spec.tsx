import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SidebarRailInbox from './SidebarRailInbox';
import SidebarRailTeams from './SidebarRailTeams';
import { createFakeSubscription } from '../../../tests/mocks/data';
import { teamsPanelStore } from '../TeamsPanel/teamsPanelStore';

jest.mock('../../lib/RoomManager', () => ({
	RoomManager: { opened: 'eng-main' },
}));

const teamRoom = createFakeSubscription({
	rid: 'eng-main',
	name: 'engineering',
	teamId: 'eng',
	teamMain: true,
	open: true,
	alert: true,
	unread: 2,
	userMentions: 0,
	groupMentions: 0,
	tunread: undefined,
});

const appRoot = (featuresPreview: { name: string; value: boolean }[]) =>
	mockAppRoot()
		.withSetting('Accounts_AllowFeaturePreview', true)
		.withUserPreference('featuresPreview', featuresPreview)
		.withSubscriptions([teamRoom])
		.withTranslations('en', 'core', { __unreadTitle__from__roomTitle__: '{{unreadTitle}} from {{roomTitle}}' })
		.build();

describe('Teams and Inbox rail items', () => {
	afterEach(() => teamsPanelStore.setState({ open: false, expandedTeams: [] }));

	it('should say the unread of the team rooms on the Teams item, open the Teams section from it with the team of the open room expanded, and close it from the Inbox item', async () => {
		render(
			<>
				<SidebarRailInbox />
				<SidebarRailTeams />
			</>,
			{ wrapper: appRoot([{ name: 'sidebarRail', value: true }]) },
		);

		const teams = screen.getByRole('button', { name: /from Teams/ });

		await userEvent.click(teams);
		expect(teamsPanelStore.getState().open).toBe(true);
		expect(teamsPanelStore.getState().expandedTeams).toEqual(['eng']);

		await userEvent.click(screen.getByRole('button', { name: /Inbox/ }));
		expect(teamsPanelStore.getState().open).toBe(false);
	});

	it('should have no Teams item while the secondary sidebar preview is on', () => {
		render(<SidebarRailTeams />, {
			wrapper: appRoot([
				{ name: 'sidebarRail', value: true },
				{ name: 'secondarySidebar', value: true },
			]),
		});

		expect(screen.queryByRole('button')).not.toBeInTheDocument();
	});
});
