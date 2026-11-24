import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VirtuosoMockContext } from 'react-virtuoso';

import { createFakeDepartment } from '../../../../../tests/mocks/data';
import CannedResponseEdit from '../modals/CannedResponseEdit';

jest.mock('@rocket.chat/ui-emoji-picker', () => ({
	...jest.requireActual('@rocket.chat/ui-emoji-picker'),
	useEmojiPicker: () => ({ open: jest.fn(), close: jest.fn(), isOpen: false }),
}));

const saveCannedResponse = jest.fn();
const getDepartments = jest.fn();
const sales = createFakeDepartment({ name: 'Sales' });

const renderForm = (permissions: string[]) => {
	const root = mockAppRoot()
		.withTranslations('en', 'core', { Required_field: '{{field}} is required' })
		.withEndpoint('POST', '/v1/canned-responses', saveCannedResponse)
		.withEndpoint('GET', '/v1/livechat/department', getDepartments)
		.wrap((children) => (
			<VirtuosoMockContext.Provider value={{ viewportHeight: 300, itemHeight: 28 }}>{children}</VirtuosoMockContext.Provider>
		));
	permissions.forEach((permission) => root.withPermission(permission));

	render(<CannedResponseEdit />, { wrapper: root.build() });
};

const fillShortcutAndMessage = async () => {
	await userEvent.type(screen.getByRole('textbox', { name: 'Shortcut' }), 'greeting');
	await userEvent.type(screen.getByRole('textbox', { name: 'Message' }), 'Hello');
};

beforeEach(() => {
	saveCannedResponse.mockReset();
	getDepartments.mockReset().mockResolvedValue({
		departments: [sales],
		count: 1,
		offset: 0,
		total: 1,
	});
});

it.each([
	['Shortcut', 'Message'],
	['Message', 'Shortcut'],
])('should show the required error and save nothing when only the %s is empty', async (emptyField, filledField) => {
	renderForm(['view-all-canned-responses']);

	await userEvent.type(screen.getByRole('textbox', { name: filledField }), 'Hello');
	await userEvent.click(screen.getByRole('button', { name: 'Save' }));

	expect(await screen.findByText(`${emptyField} is required`)).toBeInTheDocument();
	expect(saveCannedResponse).not.toHaveBeenCalled();
});

it('should show no sharing options to a user who cannot share canned responses', () => {
	renderForm([]);

	expect(screen.queryByRole('radio')).not.toBeInTheDocument();
});

it('should require a department before it saves a response shared with a department', async () => {
	renderForm(['view-all-canned-responses']);
	await fillShortcutAndMessage();
	expect(screen.queryByRole('textbox', { name: 'Department' })).not.toBeInTheDocument();

	await userEvent.click(screen.getByRole('radio', { name: 'Department' }));
	await userEvent.click(screen.getByRole('button', { name: 'Save' }));

	expect(await screen.findByText('Department is required')).toBeInTheDocument();
	expect(saveCannedResponse).not.toHaveBeenCalled();

	await userEvent.click(screen.getByRole('textbox', { name: 'Department' }));
	await userEvent.click(await screen.findByRole('option', { name: 'Sales' }));
	await userEvent.click(screen.getByRole('button', { name: 'Save' }));

	await waitFor(() =>
		expect(saveCannedResponse).toHaveBeenCalledWith(
			expect.objectContaining({ shortcut: 'greeting', text: 'Hello', scope: 'department', departmentId: sales._id }),
		),
	);
});

it.each([
	['Public', 'global'],
	['Private', 'user'],
])('should save the response with %s sharing when the user picks it', async (sharing, scope) => {
	renderForm(['view-all-canned-responses']);
	await fillShortcutAndMessage();

	await userEvent.click(screen.getByRole('radio', { name: sharing === 'Public' ? 'Private' : 'Public' }));
	await userEvent.click(screen.getByRole('radio', { name: sharing }));
	expect(screen.getByRole('radio', { name: sharing })).toBeChecked();
	await userEvent.click(screen.getByRole('button', { name: 'Save' }));

	await waitFor(() => expect(saveCannedResponse).toHaveBeenCalledWith(expect.objectContaining({ scope })));
});

it.each([
	['a manager', ['view-all-canned-responses'], true, 'false'],
	['a monitor', ['save-department-canned-responses'], false, 'true'],
	['a manager who is also a monitor', ['view-all-canned-responses', 'save-department-canned-responses'], true, 'true'],
])(
	'should let %s share publicly only when allowed, and list only their departments if a monitor',
	async (_role, permissions, canSharePublicly, onlyMyDepartments) => {
		renderForm(permissions);

		expect(screen.getByRole('radio', { name: 'Public' })).toHaveProperty('disabled', !canSharePublicly);
		expect(screen.getByRole('radio', { name: 'Private' })).toBeEnabled();

		await userEvent.click(screen.getByRole('radio', { name: 'Department' }));

		await waitFor(() => expect(getDepartments).toHaveBeenCalledWith(expect.objectContaining({ onlyMyDepartments })));
	},
);

it('should preview the message and keep it when going back to the editor', async () => {
	renderForm([]);
	expect(screen.queryByText('Preview')).not.toBeInTheDocument();

	await userEvent.type(screen.getByRole('textbox', { name: 'Message' }), 'Hello *world*');
	await userEvent.click(screen.getByText('Preview'));

	expect(screen.queryByRole('textbox', { name: 'Message' })).not.toBeInTheDocument();
	expect(screen.getByText('world')).toBeInTheDocument();

	await userEvent.click(screen.getByText('Editor'));

	expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue('Hello *world*');
});
