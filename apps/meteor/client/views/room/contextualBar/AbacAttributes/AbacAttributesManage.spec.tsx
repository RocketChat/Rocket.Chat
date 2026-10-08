import type { IAbacAttributeDefinition } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AbacAttributesManage, { getInitialAttributeRows } from './AbacAttributesManage';
import { createFakeRoom } from '../../../../../tests/mocks/data';

jest.mock('../../../../components/ABAC/AbacRoomMembershipPreview/AbacRoomMembershipPreview', () => ({
	__esModule: true,
	default: ({ attributes, onSave }: { attributes: Record<string, string[]>; onSave: (editorLosesAccess: boolean) => Promise<unknown> }) => (
		<div role='region' aria-label='preview'>
			<span>{Object.keys(attributes).join(',')}</span>
			<button onClick={() => onSave(false).catch(() => undefined)}>save keeping access</button>
			<button onClick={() => onSave(true).catch(() => undefined)}>save losing access</button>
		</div>
	),
}));

const assignable = [
	{ key: 'clearance', values: ['secret', 'top-secret'] },
	{ key: 'program', values: ['air-force'] },
	{ key: 'project', values: ['apollo'] },
];

const renderManage = (abacAttributes: IAbacAttributeDefinition[], requiredKeys: string[] = []) => {
	const save = jest.fn(async (_body: unknown) => null);
	const navigate = jest.fn();
	const onSaved = jest.fn();
	const room = createFakeRoom({ _id: 'rid', t: 'p', abacAttributes });
	const manage = (keys: string[]) => (
		<AbacAttributesManage room={room} requiredKeys={keys} onBack={jest.fn()} onClose={jest.fn()} onSaved={onSaved} />
	);

	const { rerender } = render(manage(requiredKeys), {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/abac/assignable-attributes', () => ({ attributes: assignable }))
			.withEndpoint('POST', '/v1/abac/rooms/:rid/attributes', save)
			.withRouter({ navigate })
			.build(),
	});

	return { save, navigate, onSaved, rerenderWith: (keys: string[]) => rerender(manage(keys)) };
};

const reviewButton = () => screen.getByRole('button', { name: 'ABAC_Review_changes' });

const removeOptionalAttributeAndReview = async () => {
	await userEvent.click(await screen.findByRole('button', { name: 'Remove' }));
	await waitFor(() => expect(reviewButton()).toBeEnabled());
	await userEvent.click(reviewButton());
	expect(await screen.findByRole('region', { name: 'preview' })).toBeInTheDocument();
};

describe('getInitialAttributeRows', () => {
	it('should put the required keys first, with the values the room already carries', () => {
		expect(
			getInitialAttributeRows(
				[
					{ key: 'program', values: ['air-force'] },
					{ key: 'clearance', values: ['secret'] },
				],
				['clearance', 'project'],
			),
		).toEqual([
			{ key: 'clearance', values: ['secret'] },
			{ key: 'project', values: [] },
			{ key: 'program', values: ['air-force'] },
		]);
	});

	it('should start a room with no attributes and no required keys with one empty row', () => {
		expect(getInitialAttributeRows([], [])).toEqual([{ key: '', values: [] }]);
	});
});

describe('AbacAttributesManage', () => {
	it('should keep Review changes disabled while a required key has no value', async () => {
		renderManage([{ key: 'program', values: ['air-force'] }], ['clearance']);

		expect(await screen.findAllByText('Attribute')).toHaveLength(2);
		expect(reviewButton()).toBeDisabled();
	});

	it('should keep Review changes disabled until an attribute changes', async () => {
		renderManage([
			{ key: 'clearance', values: ['secret'] },
			{ key: 'program', values: ['air-force'] },
		]);

		expect(await screen.findByRole('button', { name: 'Remove' })).toBeInTheDocument();
		expect(reviewButton()).toBeDisabled();
	});

	it('should block Review changes again when a key becomes required while the form is open', async () => {
		const { rerenderWith } = renderManage([
			{ key: 'clearance', values: ['secret'] },
			{ key: 'program', values: ['air-force'] },
		]);

		await userEvent.click(await screen.findByRole('button', { name: 'Remove' }));
		await waitFor(() => expect(reviewButton()).toBeEnabled());

		rerenderWith(['project']);

		expect(await screen.findAllByText('Attribute')).toHaveLength(2);
		await waitFor(() => expect(reviewButton()).toBeDisabled());
	});

	it('should save the reviewed attributes and return to the read view', async () => {
		const { save, navigate, onSaved } = renderManage([
			{ key: 'clearance', values: ['secret'] },
			{ key: 'program', values: ['air-force'] },
		]);

		await removeOptionalAttributeAndReview();
		await userEvent.click(screen.getByRole('button', { name: 'save keeping access' }));

		await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
		expect(save).toHaveBeenCalledWith({ attributes: { clearance: ['secret'] } });
		expect(navigate).not.toHaveBeenCalled();
	});

	it('should leave the room for home when the save removes the editor', async () => {
		const { save, navigate, onSaved } = renderManage([
			{ key: 'clearance', values: ['secret'] },
			{ key: 'program', values: ['air-force'] },
		]);

		await removeOptionalAttributeAndReview();
		await userEvent.click(screen.getByRole('button', { name: 'save losing access' }));

		await waitFor(() => expect(navigate).toHaveBeenCalledWith('/home'));
		expect(save).toHaveBeenCalledTimes(1);
		expect(onSaved).not.toHaveBeenCalled();
	});

	it('should stay on the preview when the save fails', async () => {
		const { save, navigate, onSaved } = renderManage([
			{ key: 'clearance', values: ['secret'] },
			{ key: 'program', values: ['air-force'] },
		]);
		save.mockRejectedValueOnce(new Error('error-action-not-allowed'));

		await removeOptionalAttributeAndReview();
		await userEvent.click(screen.getByRole('button', { name: 'save keeping access' }));

		await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
		expect(screen.getByRole('region', { name: 'preview' })).toBeInTheDocument();
		expect(onSaved).not.toHaveBeenCalled();
		expect(navigate).not.toHaveBeenCalled();
	});
});
