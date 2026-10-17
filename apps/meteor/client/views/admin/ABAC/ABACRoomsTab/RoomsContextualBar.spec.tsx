import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import RoomsContextualBar from './RoomsContextualBar';

jest.mock('../hooks/useAttributeList', () => ({
	useAttributeList: jest.fn(() => ({
		data: {
			attributes: [
				{ value: 'Department', label: 'Department', attributeValues: ['Engineering', 'Sales'] },
				{ value: 'Location', label: 'Location', attributeValues: ['US', 'EU'] },
			],
		},
		isLoading: false,
	})),
}));

const attributesData = [
	{ key: 'Department', values: ['Engineering'] },
	{ key: 'Location', values: ['US'] },
];

const renderBar = () => {
	const preview = jest.fn(async (_body: unknown) => ({ members: [], count: 0, checked: 2, total: 2, editor: 'compliant' as const }));
	const save = jest.fn(async (_body: unknown) => null);
	const onClose = jest.fn();

	render(<RoomsContextualBar roomInfo={{ rid: 'rid', name: 'alpha' }} attributesData={attributesData} onClose={onClose} />, {
		wrapper: mockAppRoot()
			.withSetting('ABAC_Attribute_Store', 'local')
			.withEndpoint('POST', '/v1/abac/rooms.evaluateMembership', preview)
			.withEndpoint('POST', '/v1/abac/rooms/:rid/attributes', save)
			.build(),
	});

	return { preview, save, onClose };
};

const reviewButton = () => screen.getByRole('button', { name: 'ABAC_Review_changes' });

describe('RoomsContextualBar, editing a room', () => {
	it('should keep Review changes disabled until an attribute changes', async () => {
		renderBar();

		expect(reviewButton()).toBeDisabled();

		await userEvent.click(screen.getByRole('button', { name: 'Remove' }));

		await waitFor(() => expect(reviewButton()).toBeEnabled());
	});

	it('should preview the changed attributes and keep the form values on Back', async () => {
		const { preview } = renderBar();

		await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
		await waitFor(() => expect(reviewButton()).toBeEnabled());
		await userEvent.click(reviewButton());

		expect(await screen.findByText('ABAC_Members_preview')).toBeInTheDocument();
		await waitFor(() =>
			expect(preview).toHaveBeenCalledWith(expect.objectContaining({ rid: 'rid', attributes: { Department: ['Engineering'] } })),
		);

		await userEvent.click(screen.getAllByRole('button', { name: 'Back' })[0]);

		await waitFor(() => expect(screen.queryByText('ABAC_Members_preview')).not.toBeInTheDocument());
		expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
		expect(reviewButton()).toBeEnabled();
	});

	it('should ask for a confirmation, then commit the previewed attributes and close', async () => {
		const { save, onClose } = renderBar();

		await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
		await waitFor(() => expect(reviewButton()).toBeEnabled());
		await userEvent.click(reviewButton());

		const saveButton = await screen.findByRole('button', { name: 'Save' });
		await waitFor(() => expect(saveButton).toBeEnabled());
		await userEvent.click(saveButton);

		const dialog = await screen.findByRole('dialog');
		expect(within(dialog).getByText('ABAC_Preview_Update_room')).toBeInTheDocument();
		expect(save).not.toHaveBeenCalled();

		await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

		await waitFor(() => expect(save).toHaveBeenCalledWith({ attributes: { Department: ['Engineering'] } }));
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('should not go back to the form while saving', async () => {
		const { save } = renderBar();
		save.mockImplementation(() => new Promise(() => undefined));

		await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
		await waitFor(() => expect(reviewButton()).toBeEnabled());
		await userEvent.click(reviewButton());

		const saveButton = await screen.findByRole('button', { name: 'Save' });
		await waitFor(() => expect(saveButton).toBeEnabled());
		await userEvent.click(saveButton);
		await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Save' }));

		await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
		screen.getAllByRole('button', { name: 'Back' }).forEach((back) => expect(back).toBeDisabled());
	});
});
