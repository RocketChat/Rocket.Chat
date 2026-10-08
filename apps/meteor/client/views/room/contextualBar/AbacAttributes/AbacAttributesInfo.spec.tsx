import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AbacAttributesInfo from './AbacAttributesInfo';

const appRoot = mockAppRoot().withTranslations('en', 'core', {
	ABAC_Not_set: 'Not set',
	ABAC_Room_attributes_missing: 'Room attributes missing',
	ABAC_Room_attributes_missing_channel: 'unlock this channel',
	ABAC_Room_attributes_missing_team: 'unlock this team',
	ABAC_Manage_attributes: 'Manage attributes',
});

const renderInfo = (props: Partial<Parameters<typeof AbacAttributesInfo>[0]> = {}) => {
	const onManage = jest.fn();
	render(<AbacAttributesInfo attributes={[]} requiredKeys={[]} isTeam={false} onManage={onManage} onClose={jest.fn()} {...props} />, {
		wrapper: appRoot.build(),
	});

	return { onManage };
};

describe('AbacAttributesInfo', () => {
	it('should show the missing attributes state for a channel with no attributes and no required keys', () => {
		renderInfo();

		expect(screen.getByText('Room attributes missing')).toBeInTheDocument();
		expect(screen.getByText('unlock this channel')).toBeInTheDocument();
	});

	it('should name the team in the missing attributes state of a team', () => {
		renderInfo({ isTeam: true });

		expect(screen.getByText('unlock this team')).toBeInTheDocument();
	});

	it('should mark every required key the room lacks as not set', () => {
		renderInfo({ requiredKeys: ['clearance', 'program'] });

		expect(within(screen.getByRole('region', { name: 'clearance' })).getByText('Not set')).toBeInTheDocument();
		expect(within(screen.getByRole('region', { name: 'program' })).getByText('Not set')).toBeInTheDocument();
		expect(screen.queryByText('Room attributes missing')).not.toBeInTheDocument();
	});

	it('should list the values set and mark a required key added later as not set', () => {
		renderInfo({
			attributes: [
				{ key: 'clearance', values: ['secret'] },
				{ key: 'program', values: ['air-force', 'navy'] },
			],
			requiredKeys: ['clearance', 'project'],
		});

		const program = screen.getByRole('region', { name: 'program' });
		expect(within(program).getByText('air-force')).toBeInTheDocument();
		expect(within(program).getByText('navy')).toBeInTheDocument();
		expect(within(screen.getByRole('region', { name: 'clearance' })).queryByText('Not set')).not.toBeInTheDocument();
		expect(within(screen.getByRole('region', { name: 'project' })).getByText('Not set')).toBeInTheDocument();
	});

	it('should open the form from Manage attributes', async () => {
		const { onManage } = renderInfo({ requiredKeys: ['clearance'] });

		await userEvent.click(screen.getByRole('button', { name: 'Manage attributes' }));

		expect(onManage).toHaveBeenCalledTimes(1);
	});
});
