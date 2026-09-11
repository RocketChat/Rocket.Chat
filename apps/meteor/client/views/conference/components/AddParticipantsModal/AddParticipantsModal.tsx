import { Box, CheckBox, Field, FieldRow } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import UserAutoCompleteMultiple from '../../../../components/UserAutoCompleteMultiple';
import { videoConferenceQueryKeys } from '../../../../lib/queryKeys';
import { Rooms } from '../../../../stores';
import { useCallRingPreference } from '../../hooks/useCallPreferences';

type AddParticipantsModalProps = {
	callId: string;
	rid: string;
	onClose: () => void;
};

const AddParticipantsModal = ({ callId, rid, onClose }: AddParticipantsModalProps) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const dispatchToastMessage = useToastMessageDispatch();

	const [selected, setSelected] = useState<string[]>([]);
	const [adding, setAdding] = useState(false);

	// The same habit the preflight remembers, asked here for the same reason: a ring is an interruption, and
	// someone added so they can join later is not someone to interrupt now.
	const { ring, toggleRing } = useCallRingPreference();

	// Present only for participants who can read the chat: a member added from outside the room has no room
	// here, and must still be able to add people.
	const room = Rooms.use((state) => state.get(rid));
	const isPrivate = room?.t === 'p';
	const isDirect = room?.t === 'd';

	const addParticipants = useEndpoint('POST', '/v1/video-conference.add-participants');

	// Members of the room are left out of the options: they can already join, so adding them would be a no-op.
	// Everyone else is offerable — that is the point, since membership doesn't require room access.
	// DMs expose their members on the room doc; other room types come from the members endpoint.
	const getMembers = useEndpoint('GET', isPrivate ? '/v1/groups.members' : '/v1/channels.members');
	// 100 is the members endpoints' own page size, and this asks for one page rather than paging the whole room.
	// So in a room with more members than that, some of them are still offered as options. That is a redundant
	// option rather than a wrong outcome: the server skips anyone already associated with the call, and the toast
	// below says as much. Paging every member of a large room to tidy up a picker isn't worth the requests.
	const membersQuery = useQuery({
		enabled: !!room && !isDirect,
		queryKey: ['conference', 'add-participants', 'members', rid, room?.t],
		queryFn: () => getMembers({ roomId: rid, count: 100 }),
	});

	const memberUsernames = useMemo(() => {
		if (isDirect) {
			return room?.usernames ?? [];
		}
		return (membersQuery.data?.members ?? []).map((member) => member.username).filter((username): username is string => !!username);
	}, [isDirect, room?.usernames, membersQuery.data]);

	// Adding makes them members of the *conference*, which is what lets them join the call — it deliberately
	// puts them in no room. Whether they can read the chat is surfaced separately, once it matters, rather
	// than being decided here. The server rings everyone added, unless told not to.
	const handleAdd = async () => {
		if (!selected.length) {
			return;
		}
		setAdding(true);
		try {
			const { added } = await addParticipants({ callId, users: selected, ring });

			// Anyone already associated with the call is skipped server-side, so a selection can come back empty.
			// Reporting that as success would claim people were called who never were.
			dispatchToastMessage(
				added.length
					? { type: 'success', message: t('Users_added') }
					: { type: 'info', message: t('Selected_users_are_already_in_the_call') },
			);

			// Read the call again rather than waiting to be told about our own doing: the window is watching the
			// conference for changes other people make, and leaning on that for a change made *here* left the
			// members panel — the very panel this was opened from — still listing who was in the call before.
			if (added.length) {
				void queryClient.invalidateQueries({ queryKey: videoConferenceQueryKeys.conference(callId) });
			}

			onClose();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			setAdding(false);
		}
	};

	return (
		<GenericModal
			icon={null}
			title={t('Add_people')}
			confirmText={t('Add')}
			confirmDisabled={!selected.length}
			confirmLoading={adding}
			onConfirm={handleAdd}
			onCancel={onClose}
		>
			<Field>
				<FieldRow>
					{/* The product's own way of picking people, the same as adding them to a room — this used to be
					    hand-rolled here, down to the chips and the remove buttons. */}
					<UserAutoCompleteMultiple
						value={selected}
						onChange={setSelected}
						exceptions={memberUsernames}
						placeholder={t('Choose_users')}
						// A placeholder is not a name: it is gone the moment anything is typed, and it names the field
						// only for whoever can see it.
						aria-label={t('Add_people')}
					/>
				</FieldRow>
			</Field>
			{/* Under the names, because it is a question about the people just chosen. */}
			<Field>
				<FieldRow justifyContent='flex-start'>
					<CheckBox id='conference-add-participants-ring' checked={ring} onChange={toggleRing} />
					<Box is='label' htmlFor='conference-add-participants-ring' fontScale='p2' color='default' marginInlineStart={8}>
						{t('Ring_people')}
					</Box>
				</FieldRow>
			</Field>
		</GenericModal>
	);
};

export default AddParticipantsModal;
