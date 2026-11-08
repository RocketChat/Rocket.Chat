import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import MessageRoles from './MessageRoles';

const wrapper = mockAppRoot().build();

it('collapses each scope into one tag that names the first role and counts the rest', () => {
	render(<MessageRoles workspaceRoles={['Admin', 'Livechat Manager', 'Auditor']} roomRoles={['Owner']} />, { wrapper });

	expect(screen.getByTitle('Workspace_roles: Admin, Livechat Manager, Auditor')).toHaveTextContent('Admin +2');
	expect(screen.getByTitle('Room_roles: Owner')).toHaveTextContent('Owner');
});

it('leaves out a scope without roles and still tags bots', () => {
	render(<MessageRoles workspaceRoles={[]} roomRoles={[]} isBot />, { wrapper });

	expect(screen.queryByTitle(/^Workspace_roles/)).not.toBeInTheDocument();
	expect(screen.queryByTitle(/^Room_roles/)).not.toBeInTheDocument();
	expect(screen.getByText('Bot')).toBeInTheDocument();
});

it('reports clicks on a role tag', async () => {
	const onClick = jest.fn();
	render(<MessageRoles workspaceRoles={['Admin']} roomRoles={[]} onClick={onClick} />, { wrapper });

	await userEvent.click(screen.getByText('Admin'));

	expect(onClick).toHaveBeenCalledTimes(1);
});
