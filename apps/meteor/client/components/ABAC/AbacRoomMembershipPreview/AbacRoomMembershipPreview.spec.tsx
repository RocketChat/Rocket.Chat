import type { AbacMembershipGroup, AbacPreviewCursor, AbacRoomPreviewMember, IAbacRoomMembershipPreview } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import type { ReactNode } from 'react';
import { VirtuosoMockContext } from 'react-virtuoso';

import AbacRoomMembershipPreview from './AbacRoomMembershipPreview';

type PreviewBody = { group?: AbacMembershipGroup; filter?: string; after?: AbacPreviewCursor };

const bob: AbacRoomPreviewMember = { _id: 'bob', username: 'bob', name: 'Bob', verdict: 'nonCompliant' };
const carol: AbacRoomPreviewMember = { _id: 'carol', username: 'carol', name: 'Carol', verdict: 'inconclusive' };

const page = (over: Partial<IAbacRoomMembershipPreview> = {}): IAbacRoomMembershipPreview => {
	const members = over.members ?? [];
	return { members, count: members.length, checked: 3, total: 3, ...over };
};

const renderPreview = (respond: (body: PreviewBody) => IAbacRoomMembershipPreview | Promise<IAbacRoomMembershipPreview>) => {
	const endpoint = jest.fn(async (body: PreviewBody) => respond(body));
	const onSave = jest.fn(async (_editorLosesAccess: boolean) => undefined);
	const onBack = jest.fn();
	const AppRoot = mockAppRoot()
		.withJohnDoe()
		.withEndpoint('POST', '/v1/abac/membership-preview', (body) => endpoint('rid' in body ? body : {}))
		.build();
	const wrapper = ({ children }: { children: ReactNode }) => (
		<AppRoot>
			<VirtuosoMockContext.Provider value={{ viewportHeight: 600, itemHeight: 44 }}>{children}</VirtuosoMockContext.Provider>
		</AppRoot>
	);

	const view = render(
		<AbacRoomMembershipPreview rid='rid' roomName='alpha' attributes={{ dept: ['eng'] }} onBack={onBack} onSave={onSave} />,
		{ wrapper },
	);

	return { ...view, endpoint, onSave, onBack };
};

const saveButton = () => screen.getByRole('button', { name: 'Save' });

describe('AbacRoomMembershipPreview', () => {
	it('should say nobody loses access once the list runs out empty, and save without a confirmation', async () => {
		const { onSave } = renderPreview(() => page({ editor: 'compliant' }));

		expect(await screen.findByText('ABAC_Preview_No_members_lose_access')).toBeInTheDocument();
		expect(screen.getByRole('status')).toHaveTextContent(/^ABAC_Preview_Progress_Removed$/);
		await waitFor(() => expect(saveButton()).toBeEnabled());
		await userEvent.click(saveButton());

		expect(onSave).toHaveBeenCalledTimes(1);
		expect(onSave).toHaveBeenCalledWith(false);
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('should list who loses access and save without a confirmation when the editor keeps access', async () => {
		const { onSave } = renderPreview(() => page({ members: [bob], editor: 'compliant' }));

		const list = await screen.findByRole('list', { name: 'ABAC_Preview_Loses_access' });
		expect(within(list).getByText('Bob')).toBeInTheDocument();
		expect(within(list).getByRole('img', { name: 'ABAC_Preview_Loses_access' })).toBeInTheDocument();
		expect(screen.queryByText('ABAC_Preview_No_members_lose_access')).not.toBeInTheDocument();

		await waitFor(() => expect(saveButton()).toBeEnabled());
		await userEvent.click(saveButton());

		expect(onSave).toHaveBeenCalledTimes(1);
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it.each(['nonCompliant', 'inconclusive'] as const)(
		'should ask an editor whose verdict is %s to confirm losing access',
		async (verdict) => {
			const { onSave } = renderPreview(() => page({ members: [bob], editor: verdict }));

			await waitFor(() => expect(saveButton()).toBeEnabled());
			await userEvent.click(saveButton());

			const dialog = await screen.findByRole('dialog');
			expect(within(dialog).getByText('ABAC_Preview_Self_lockout_warning')).toBeInTheDocument();
			expect(onSave).not.toHaveBeenCalled();

			await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

			await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
			expect(onSave).toHaveBeenCalledWith(true);
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		},
	);

	it('should pause checking once Save is pressed, without marking the list partial', async () => {
		const { endpoint, onSave } = renderPreview(({ after }) =>
			after
				? new Promise<never>(() => undefined)
				: page({ members: [bob], editor: 'compliant', total: 1000, next: { _id: 'bob', username: 'bob' } }),
		);

		await waitFor(() => expect(endpoint).toHaveBeenCalledTimes(2));
		await waitFor(() => expect(saveButton()).toBeEnabled());
		await userEvent.click(saveButton());
		await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
		await waitFor(() => expect(screen.getByRole('button', { name: 'Back' })).toBeEnabled());

		expect(endpoint).toHaveBeenCalledTimes(2);
		expect(screen.getByText('Bob')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'ABAC_Preview_Stop' })).not.toBeInTheDocument();
		expect(screen.queryByText('ABAC_Preview_Partial_warning')).not.toBeInTheDocument();
	});

	it('should not mark a settled list partial when Save is pressed', async () => {
		const pageOfEleven = (after?: AbacPreviewCursor): IAbacRoomMembershipPreview => {
			const start = after ? Number(after._id.slice(1)) + 1 : 0;
			const members = Array.from({ length: 11 }, (_, index): AbacRoomPreviewMember => {
				const id = `m${start + index}`;
				return { _id: id, username: id, name: id, verdict: 'nonCompliant' };
			});
			const last = members[members.length - 1];
			return {
				members,
				count: members.length,
				checked: 25,
				...(!after && { total: 300, editor: 'compliant' }),
				next: { _id: last._id, username: last._id },
			};
		};
		const { endpoint, onSave } = renderPreview(({ after }) => pageOfEleven(after));

		await waitFor(() => expect(endpoint).toHaveBeenCalledTimes(3));
		await waitFor(() => expect(screen.queryByRole('button', { name: 'ABAC_Preview_Stop' })).not.toBeInTheDocument());
		expect(screen.queryByText('ABAC_Preview_Partial_warning')).not.toBeInTheDocument();

		await userEvent.click(saveButton());
		await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
		await waitFor(() => expect(screen.getByRole('button', { name: 'Back' })).toBeEnabled());

		expect(endpoint).toHaveBeenCalledTimes(3);
		expect(screen.queryByText('ABAC_Preview_Partial_warning')).not.toBeInTheDocument();
	});

	it('should resume checking from the end of the list after Stop', async () => {
		let releaseSecondPage: () => void = () => undefined;
		let served = 0;
		const { endpoint } = renderPreview(async () => {
			served += 1;
			if (served === 1) {
				return page({ members: [bob], editor: 'compliant', total: 1000, next: { _id: 'bob', username: 'bob' } });
			}
			if (served === 2) {
				await new Promise<void>((resolve) => {
					releaseSecondPage = () => resolve();
				});
				return page({ total: undefined, next: { _id: 'c2', username: 'c2' } });
			}
			return new Promise<never>(() => undefined);
		});

		await waitFor(() => expect(endpoint).toHaveBeenCalledTimes(2));
		await userEvent.click(screen.getByRole('button', { name: 'ABAC_Preview_Stop' }));
		releaseSecondPage();

		expect(await screen.findByText('ABAC_Preview_Partial_warning')).toBeInTheDocument();
		expect(endpoint).toHaveBeenCalledTimes(2);

		await userEvent.click(screen.getByRole('button', { name: 'Load_more' }));

		await waitFor(() => expect(endpoint).toHaveBeenCalledTimes(3));
		expect(await screen.findByRole('button', { name: 'ABAC_Preview_Stop' })).toBeInTheDocument();
		expect(screen.queryByText('ABAC_Preview_Partial_warning')).not.toBeInTheDocument();
	});

	it('should not save when the editor cancels the confirmation', async () => {
		const { onSave } = renderPreview(() => page({ members: [bob], editor: 'nonCompliant' }));

		await waitFor(() => expect(saveButton()).toBeEnabled());
		await userEvent.click(saveButton());
		await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel' }));

		expect(onSave).not.toHaveBeenCalled();
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('should save without a confirmation when the editor is not a member of the room', async () => {
		const { onSave } = renderPreview(() => page({ members: [bob] }));

		await waitFor(() => expect(saveButton()).toBeEnabled());
		await userEvent.click(saveButton());

		expect(onSave).toHaveBeenCalledTimes(1);
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('should never say nobody loses access when the list stopped before every member was checked', async () => {
		renderPreview(({ after }) =>
			page({ editor: 'compliant', next: { _id: 'cursor', username: 'cursor' }, ...(after ? { total: undefined } : { total: 1000 }) }),
		);

		expect(await screen.findByText('ABAC_Preview_Partial_warning')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Load_more' })).toBeInTheDocument();
		expect(screen.getByRole('status')).toHaveTextContent(/^ABAC_Preview_Progress_Removed_so_far$/);
		expect(screen.queryByText('ABAC_Preview_No_members_lose_access')).not.toBeInTheDocument();
	});

	it('should not say nobody loses access when only a search ran out empty', async () => {
		renderPreview(({ filter }) => (filter ? page({ total: 0, checked: 0 }) : page({ members: [bob], editor: 'compliant' })));

		expect(await screen.findByText('Bob')).toBeInTheDocument();
		await userEvent.type(screen.getByRole('textbox', { name: 'ABAC_Preview_Search_members' }), 'zz');

		expect(await screen.findByText('No_members_found')).toBeInTheDocument();
		expect(screen.queryByText('ABAC_Preview_No_members_lose_access')).not.toBeInTheDocument();
	});

	it('should list the editor first, once, when they are in the selected group', async () => {
		const johnDoe: AbacRoomPreviewMember = { _id: 'john.doe', username: 'john.doe', name: 'John Doe', verdict: 'nonCompliant' };
		renderPreview(() => page({ members: [bob, johnDoe], editor: 'nonCompliant' }));

		const list = await screen.findByRole('list', { name: 'ABAC_Preview_Loses_access' });
		const rows = within(list).getAllByRole('listitem');

		expect(rows).toHaveLength(2);
		expect(rows[0]).toHaveTextContent('John Doe');
		expect(rows[1]).toHaveTextContent('Bob');
	});

	it('should leave the editor out of a group they are not in', async () => {
		renderPreview(() => page({ members: [bob], editor: 'compliant' }));

		expect(await screen.findByText('Bob')).toBeInTheDocument();

		expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
	});

	it('should leave the editor out of a search they do not match', async () => {
		renderPreview(({ filter }) => page({ members: filter ? [] : [bob], editor: 'nonCompliant', ...(filter && { total: 0, checked: 0 }) }));

		expect(await screen.findByText('John Doe')).toBeInTheDocument();

		await userEvent.type(screen.getByRole('textbox', { name: 'ABAC_Preview_Search_members' }), 'zz');

		expect(await screen.findByText('No_members_found')).toBeInTheDocument();
		expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
	});

	it('should mark a member whose access could not be determined', async () => {
		renderPreview(() => page({ members: [carol], editor: 'compliant' }));

		const list = await screen.findByRole('list', { name: 'ABAC_Preview_Loses_access' });
		expect(within(list).getByRole('img', { name: 'ABAC_Preview_Inconclusive_Removed' })).toBeInTheDocument();
	});

	it('should mark a member who keeps access', async () => {
		const dave: AbacRoomPreviewMember = { _id: 'dave', username: 'dave', name: 'Dave', verdict: 'compliant' };
		renderPreview(({ group }) => page({ members: group === 'retains' ? [dave] : [], editor: 'compliant' }));

		await userEvent.click(await screen.findByRole('button', { name: 'ABAC_Preview_Loses_access' }));
		await userEvent.click(screen.getByRole('option', { name: 'ABAC_Preview_Retains_access' }));

		const list = await screen.findByRole('list', { name: 'ABAC_Preview_Retains_access' });
		const rows = await within(list).findAllByRole('listitem');

		expect(rows).toHaveLength(2);
		rows.forEach((row) => expect(within(row).getByRole('img', { name: 'ABAC_Preview_Retains_access' })).toBeInTheDocument());
	});

	it('should tag a member with their highest room role', async () => {
		renderPreview(() => page({ members: [{ ...bob, roles: ['moderator', 'owner'] }], editor: 'compliant' }));

		expect(await screen.findByText('ABAC_Preview_Role_Owner')).toBeInTheDocument();
		expect(screen.queryByText('ABAC_Preview_Role_Moderator')).not.toBeInTheDocument();
	});

	it('should keep Save disabled and explain when the preview fails', async () => {
		renderPreview(() => {
			throw new Error('unavailable');
		});

		expect(await screen.findByText('ABAC_Preview_Unavailable')).toBeInTheDocument();
		expect(saveButton()).toBeDisabled();
	});

	it('should go back to the form', async () => {
		const { onBack } = renderPreview(() => page({ editor: 'compliant' }));

		await userEvent.click(screen.getByRole('button', { name: 'Back' }));

		expect(onBack).toHaveBeenCalledTimes(1);
	});

	it('should have no accessibility violations', async () => {
		const { container } = renderPreview(() => page({ members: [bob, carol], editor: 'compliant' }));

		expect(await screen.findByText('Bob')).toBeInTheDocument();

		expect(await axe(container)).toHaveNoViolations();
	});
});
