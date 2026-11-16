import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TeamsPanelEmpty from './TeamsPanelEmpty';

it('should open the teams tab of the Directory, and leave out Create team without the create-team permission', async () => {
	const navigate = jest.fn();

	render(<TeamsPanelEmpty />, {
		wrapper: mockAppRoot()
			.withRouter({ navigate })
			.withTranslations('en', 'core', { Teams_New_Title: 'Create team', Browse_teams_in_directory: 'Browse teams in the Directory' })
			.build(),
	});

	expect(screen.queryByRole('button', { name: 'Create team' })).not.toBeInTheDocument();

	await userEvent.click(screen.getByRole('button', { name: 'Browse teams in the Directory' }));

	expect(navigate).toHaveBeenCalledWith('/directory/teams');
});
