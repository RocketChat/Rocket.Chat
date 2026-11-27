import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { ConferenceLink } from './ConferenceLink';
import type { UseVideoCallMenuSectionsInput } from './useVideoCallMenuSections';
import { useVideoCallMenuSections } from './useVideoCallMenuSections';
import { absoluteUrl } from '../../../../lib/absoluteUrl';

const handleOpenCall = jest.fn();

jest.mock('../../contextualBar/VideoConference/hooks/useVideoConfOpenCall', () => ({
	useVideoConfOpenCall: () => handleOpenCall,
}));

const writeText = jest.fn(async () => undefined);

const weekly: ConferenceLink = { _id: 'weekly-id', title: 'Weekly sync', url: 'weekly-sync', ongoing: false };
const standup: ConferenceLink = { _id: 'standup-id', title: 'Daily standup', url: 'daily-standup', ongoing: true };
const links = [weekly, standup];

const originalRootUrl = absoluteUrl.defaultOptions.rootUrl;

beforeAll(() => {
	Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
});

beforeEach(() => {
	absoluteUrl.defaultOptions.rootUrl = 'https://chat.example.com/';
	handleOpenCall.mockClear();
	writeText.mockClear();
});

afterAll(() => {
	absoluteUrl.defaultOptions.rootUrl = originalRootUrl;
});

type Sections = ReturnType<typeof useVideoCallMenuSections>;
type Item = Sections[number]['items'][number];

const allItems = (sections: Sections): Item[] =>
	sections.flatMap(({ items }) => items.flatMap((item) => [item, ...((item.items ?? []) as Item[])]));

const item = (sections: Sections, id: string) => {
	const found = allItems(sections).find((entry) => entry.id === id);
	if (!found) {
		throw new Error(`no item ${id}`);
	}
	return found;
};

const renderSections = (input: Partial<UseVideoCallMenuSectionsInput> = {}) => {
	const onStart = jest.fn();
	const endpoint = jest.fn(async () => ({}) as any);
	const dispatchToast = jest.fn();

	const view = renderHook((props: Partial<UseVideoCallMenuSectionsInput>) => useVideoCallMenuSections({ ...defaults(onStart), ...props }), {
		initialProps: input,
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withToastMessageDispatch(dispatchToast)
			.withRouter({ buildRoutePath: (to) => (typeof to === 'object' && 'name' in to ? `/conference/${to.params?.id}` : '/') })
			.withEndpoint('GET', '/v1/video-conference.capabilities', endpoint)
			.withEndpoint('GET', '/v1/video-conference.info', endpoint)
			.withEndpoint('POST', '/v1/video-conference.rooms.create', endpoint)
			.withEndpoint('POST', '/v1/video-conference.rooms.rename', endpoint)
			.withEndpoint('POST', '/v1/video-conference.rooms.delete', endpoint)
			.build(),
	});

	return { ...view, onStart, endpoint, dispatchToast };
};

const defaults = (onStart: () => void): UseVideoCallMenuSectionsInput => ({
	rid: 'room-id',
	links,
	canStart: true,
	canManage: true,
	startDisabled: false,
	onStart,
});

it('starts through the handler it was given', () => {
	const { result, onStart } = renderSections();

	act(() => item(result.current, 'start-conference').onClick?.());

	expect(onStart).toHaveBeenCalledTimes(1);
	expect(onStart).toHaveBeenCalledWith();
});

describe('Open and Join call', () => {
	it('opens the call window at the link address', () => {
		const { result } = renderSections();

		act(() => item(result.current, 'link-weekly-id-open').onClick?.());

		expect(handleOpenCall).toHaveBeenCalledTimes(1);
		expect(handleOpenCall).toHaveBeenCalledWith('https://chat.example.com/conference/weekly-sync');
	});

	it('does so for an ongoing link as well', () => {
		const { result } = renderSections();

		act(() => item(result.current, 'link-standup-id-join').onClick?.());

		expect(handleOpenCall).toHaveBeenCalledWith('https://chat.example.com/conference/daily-standup');
	});

	// A browser refuses a window opened after the click has been left waiting on anything.
	it('opens it without waiting for anything', () => {
		const { result, endpoint } = renderSections();

		item(result.current, 'link-weekly-id-open').onClick?.();

		expect(handleOpenCall).toHaveBeenCalledTimes(1);
		expect(endpoint).not.toHaveBeenCalled();
	});
});

describe('Copy link', () => {
	it('copies the absolute address of the link', async () => {
		const { result, dispatchToast } = renderSections();

		await act(async () => item(result.current, 'link-weekly-id-copy').onClick?.());

		await waitFor(() => expect(writeText).toHaveBeenCalledWith('https://chat.example.com/conference/weekly-sync'));
		await waitFor(() => expect(dispatchToast).toHaveBeenCalledWith({ type: 'success', message: 'Copied' }));
	});

	it('copies it under a ROOT_URL path prefix', async () => {
		absoluteUrl.defaultOptions.rootUrl = 'https://chat.example.com/support/';
		const { result } = renderSections();

		await act(async () => item(result.current, 'link-weekly-id-copy').onClick?.());

		await waitFor(() => expect(writeText).toHaveBeenCalledWith('https://chat.example.com/support/conference/weekly-sync'));
	});
});

describe('modals', () => {
	it('opens the create modal', async () => {
		const { result, endpoint } = renderSections();

		act(() => item(result.current, 'create-link').onClick?.());

		expect(await screen.findByRole('dialog')).toHaveTextContent('Create_link');
		expect(screen.getByRole('textbox', { name: 'Conference_link_name' })).toHaveValue('');
		expect(endpoint).not.toHaveBeenCalled();
	});

	it("opens the rename modal with the link's title", async () => {
		const { result, endpoint } = renderSections();

		act(() => item(result.current, 'link-weekly-id-rename').onClick?.());

		expect(await screen.findByRole('dialog')).toHaveTextContent('Rename_conference_link');
		expect(screen.getByRole('textbox', { name: 'Conference_link_name' })).toHaveValue('Weekly sync');
		expect(endpoint).not.toHaveBeenCalled();
	});

	it('opens the delete modal for the link', async () => {
		const { result, endpoint } = renderSections();

		act(() => item(result.current, 'link-standup-id-delete').onClick?.());

		expect(await screen.findByRole('dialog')).toHaveTextContent('Delete_conference_link');
		expect(endpoint).not.toHaveBeenCalled();

		await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

		await waitFor(() => expect(endpoint).toHaveBeenCalledWith({ conferenceRoomId: 'standup-id' }));
	});

	it('closes the modal it opened', async () => {
		const { result } = renderSections();

		act(() => item(result.current, 'create-link').onClick?.());
		await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
	});
});

it('gives a member without call-management the links only', () => {
	const { result } = renderSections({ canStart: false, canManage: false });

	const contents = allItems(result.current).map(({ content }) => content);

	expect(contents).not.toContain('Start_conference');
	expect(contents).not.toContain('Create_link');
	expect(contents).not.toContain('Rename');
	expect(contents).not.toContain('Delete');
	expect(contents).toEqual(expect.arrayContaining(['Open', 'Join_call', 'Copy_link']));
});

it('explains why Start conference and Create link are disabled', () => {
	const { result } = renderSections({ startDisabled: true, startDisabledReason: 'Join_the_room_to_start_a_call' });

	for (const id of ['start-conference', 'create-link']) {
		expect(item(result.current, id)).toMatchObject({ disabled: true, tooltip: 'Join_the_room_to_start_a_call' });
	}
});

it('returns the same sections for the same input', () => {
	const { result, rerender } = renderSections();
	const first = result.current;

	rerender({});

	expect(result.current).toBe(first);
});
