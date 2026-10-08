import type { AbacMembershipGroup, AbacPreviewCursor, AbacRoomPreviewMember, IAbacRoomMembershipPreview } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { Contextualbar, ModalProviderWithRegion, TooltipProvider } from '@rocket.chat/ui-client';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import AbacRoomMembershipPreview from './AbacRoomMembershipPreview';

type PreviewPage = { group?: AbacMembershipGroup; filter?: string; after?: AbacPreviewCursor; count?: number };

const member = (username: string, name: string, verdict: AbacRoomPreviewMember['verdict'], roles?: string[]): AbacRoomPreviewMember => ({
	_id: username,
	username,
	name,
	verdict,
	...(roles && { roles }),
});

const losing = [
	member('aisha.khan', 'Aisha Khan', 'nonCompliant'),
	member('ava.garcia', 'Ava Garcia', 'nonCompliant', ['moderator']),
	member('charlotte.white', 'Charlotte White', 'nonCompliant'),
	member('ethan.brown', 'Ethan Brown', 'nonCompliant', ['leader']),
	member('isabel.thompson.intelligence.directorate', 'Isabel Thompson-Whitaker', 'nonCompliant', ['leader']),
	member('jamal.rivera', 'Jamal Rivera', 'inconclusive'),
	member('liam.johnson', 'Liam Johnson', 'nonCompliant', ['owner']),
	member('lucas.martinez', 'Lucas Martinez', 'nonCompliant'),
	member('mason.anderson', 'Mason Anderson', 'nonCompliant'),
	member('nina.petrov', 'Nina Petrov', 'inconclusive'),
	member('olivia.chen', 'Olivia Chen', 'nonCompliant', ['moderator']),
	member('sofia.rossi', 'Sofia Rossi', 'nonCompliant'),
];

const retaining = [
	member('amara.okafor', 'Amara Okafor', 'compliant', ['owner']),
	member('daniel.kim', 'Daniel Kim', 'compliant'),
	member('grace.lee', 'Grace Lee', 'compliant', ['moderator']),
	member('henry.wilson', 'Henry Wilson', 'compliant'),
];

const pageOf = (members: AbacRoomPreviewMember[], over: Partial<IAbacRoomMembershipPreview> = {}): IAbacRoomMembershipPreview => ({
	members,
	count: members.length,
	checked: losing.length + retaining.length,
	total: losing.length + retaining.length,
	editor: 'compliant',
	...over,
});

const pending = () => new Promise<never>(() => undefined);

const withPreview = (respond: (page: PreviewPage) => IAbacRoomMembershipPreview | Promise<IAbacRoomMembershipPreview>) =>
	mockAppRoot()
		.withJohnDoe()
		.withTranslations('en', 'core', {
			ABAC_Preview_Access_filter: 'Access',
			ABAC_Preview_Inconclusive_Removed: 'Access could not be determined. This member will be removed.',
			ABAC_Preview_Loses_access: 'Loses access',
			ABAC_Preview_No_members_lose_access: 'No members lose access',
			ABAC_Preview_No_members_retain_access: 'No members retain access',
			ABAC_Preview_Partial_warning: 'Not every member was checked, so this list may be incomplete.',
			ABAC_Preview_Progress_Kept_one: '{{count}} of {{total}} members keeps access to {{roomName}}.',
			ABAC_Preview_Progress_Kept_other: '{{count}} of {{total}} members keep access to {{roomName}}.',
			ABAC_Preview_Progress_Kept_matching_one: '{{count}} of {{total}} matching members keeps access to {{roomName}}.',
			ABAC_Preview_Progress_Kept_matching_other: '{{count}} of {{total}} matching members keep access to {{roomName}}.',
			ABAC_Preview_Progress_Kept_matching_so_far_one:
				'Checked {{checked}} of {{total}} matching members. {{count}} keeps access to {{roomName}} so far.',
			ABAC_Preview_Progress_Kept_matching_so_far_other:
				'Checked {{checked}} of {{total}} matching members. {{count}} keep access to {{roomName}} so far.',
			ABAC_Preview_Progress_Kept_so_far_one: 'Checked {{checked}} of {{total}} members. {{count}} keeps access to {{roomName}} so far.',
			ABAC_Preview_Progress_Kept_so_far_other: 'Checked {{checked}} of {{total}} members. {{count}} keep access to {{roomName}} so far.',
			ABAC_Preview_Progress_Removed: '{{count}} of {{total}} members will be removed from {{roomName}}.',
			ABAC_Preview_Progress_Removed_matching: '{{count}} of {{total}} matching members will be removed from {{roomName}}.',
			ABAC_Preview_Progress_Removed_matching_so_far:
				'Checked {{checked}} of {{total}} matching members. {{count}} will be removed from {{roomName}} so far.',
			ABAC_Preview_Progress_Removed_so_far: 'Checked {{checked}} of {{total}} members. {{count}} will be removed from {{roomName}} so far.',
			ABAC_Preview_Retains_access: 'Retains access',
			ABAC_Preview_Role_Leader: 'Leader',
			ABAC_Preview_Role_Moderator: 'Moderator',
			ABAC_Preview_Role_Owner: 'Owner',
			ABAC_Preview_Search_members: 'Search members',
			ABAC_Preview_Self_lockout_warning: 'You will lose access to {{roomName}} and will not be able to open it again.',
			ABAC_Preview_Stop: 'Stop',
			ABAC_Preview_Unavailable: 'Could not check who will have access. Try again later.',
			Are_you_sure: 'Are you sure?',
			Back: 'Back',
			Cancel: 'Cancel',
			Load_more: 'Load more',
			No_members_found: 'No members found',
			Save: 'Save',
		})
		.withEndpoint('POST', '/v1/abac/membership-preview', (body) => respond('rid' in body ? body : {}))
		.wrap((children) => <ModalProviderWithRegion>{children}</ModalProviderWithRegion>)
		.buildStoryDecorator();

const bySearch = (members: AbacRoomPreviewMember[], filter = '') =>
	members.filter(({ username, name }) => `${username} ${name}`.toLowerCase().includes(filter.toLowerCase()));

const firstNames = ['Aisha', 'Ava', 'Charlotte', 'Daniel', 'Ethan', 'Grace', 'Henry', 'Isabel', 'Jamal', 'Liam', 'Lucas', 'Nina'];
const lastNames = ['Anderson', 'Brown', 'Chen', 'Garcia', 'Khan', 'Kim', 'Lee', 'Martinez', 'Okafor', 'Petrov', 'Rossi', 'White'];

type VerdictAt = (index: number) => AbacRoomPreviewMember['verdict'];

const manyLose: VerdictAt = (index) => {
	if (index % 11 === 0) {
		return 'inconclusive';
	}
	return index % 5 < 2 ? 'nonCompliant' : 'compliant';
};

const fewLose: VerdictAt = (index) => {
	if (index % 30 === 0) {
		return 'inconclusive';
	}
	return index % 15 === 0 ? 'nonCompliant' : 'compliant';
};

const roleAt = (index: number): string[] | undefined => {
	if (index % 40 === 0) {
		return ['owner'];
	}
	if (index % 15 === 0) {
		return ['moderator'];
	}
	return index % 23 === 0 ? ['leader'] : undefined;
};

const largeRoom = (verdictAt: VerdictAt) =>
	Array.from({ length: 300 }, (_, index) => {
		const first = firstNames[index % firstNames.length];
		const last = lastNames[Math.floor(index / firstNames.length) % lastNames.length];
		return member(`${first}.${last}.${index}`.toLowerCase(), `${first} ${last}`, verdictAt(index), roleAt(index));
	});

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const SCAN_LIMIT = 50;
const EVALUATION_STEP = 25;

const pagedRoom =
	(room: AbacRoomPreviewMember[]) =>
	async ({ group, filter, after, count = 25 }: PreviewPage): Promise<IAbacRoomMembershipPreview> => {
		await delay(600);

		const population = bySearch(room, filter);
		const start = after ? population.findIndex(({ _id }) => _id === after._id) + 1 : 0;
		const window = population.slice(start, start + SCAN_LIMIT);
		const members: AbacRoomPreviewMember[] = [];
		let checked = 0;

		while (checked < window.length && members.length < count) {
			const batch = window.slice(checked, checked + EVALUATION_STEP);
			members.push(...batch.filter(({ verdict }) => (verdict !== 'compliant') === (group !== 'retains')));
			checked += batch.length;
		}

		const last = window[checked - 1];
		return {
			members,
			count: members.length,
			checked,
			...(!after && { total: population.length }),
			...(!after && !filter && { editor: 'compliant' as const }),
			...(start + checked < population.length && last && { next: { _id: last._id, username: last.username } }),
		};
	};

const meta = {
	component: AbacRoomMembershipPreview,
	args: {
		rid: 'room-id',
		roomName: 'intel-assessments',
		attributes: { clearance: ['secret'], project: ['alpha-missions'] },
		onBack: action('onBack'),
		onSave: async () => action('onSave')(),
	},
	decorators: [
		(Story) => (
			<TooltipProvider>
				<Box width='x500' height='100vh' display='flex'>
					<Contextualbar width='full'>
						<Story />
					</Contextualbar>
				</Box>
			</TooltipProvider>
		),
	],
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof AbacRoomMembershipPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const LargeRoomLoadsOnScroll: Story = {
	decorators: [withPreview(pagedRoom(largeRoom(manyLose)))],
};

export const LargeRoomStopsAtFetchCap: Story = {
	decorators: [withPreview(pagedRoom(largeRoom(fewLose)))],
};

export const SomeLoseAccess: Story = {
	decorators: [withPreview(({ group, filter }) => pageOf(bySearch(group === 'retains' ? retaining : losing, filter)))],
};

export const NobodyLosesAccess: Story = {
	decorators: [
		withPreview(({ group, filter }) =>
			pageOf(group === 'retains' ? bySearch([...retaining, ...losing.map((m) => ({ ...m, verdict: 'compliant' as const }))], filter) : []),
		),
	],
};

export const CheckingInProgress: Story = {
	decorators: [
		withPreview(({ after }) =>
			after
				? pending()
				: pageOf(losing.slice(0, 3), { checked: 40, total: 1500, next: { _id: 'mason.anderson', username: 'mason.anderson' } }),
		),
	],
};

export const PartialList: Story = {
	decorators: [
		withPreview(({ after }) => {
			const index = after ? losing.findIndex(({ _id }) => _id === after._id) + 1 : 0;
			const members = losing.slice(index, index + 1);
			return pageOf(members, {
				checked: 25,
				...(!after && { total: 1500 }),
				...(members.length > 0 && { next: { _id: members[0]._id, username: members[0].username } }),
			});
		}),
	],
};

export const EditorLosesAccess: Story = {
	decorators: [withPreview(({ group }) => pageOf(group === 'retains' ? retaining : losing, { editor: 'nonCompliant' }))],
};

export const Loading: Story = {
	decorators: [withPreview(pending)],
};

export const PreviewUnavailable: Story = {
	decorators: [withPreview(() => Promise.reject(new Error('error-pdp-unavailable')))],
};
