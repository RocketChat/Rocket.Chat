import { isDirectMessageRoom, isPrivateRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { CheckBox, Field, FieldGroup, FieldLabel, FieldRow } from '@rocket.chat/fuselage-forms';
import { GenericModal } from '@rocket.chat/ui-client';
import { useEndpoint, useToastMessageDispatch, useUserRoom } from '@rocket.chat/ui-contexts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import UserAutoCompleteMultiple from '../../../../components/UserAutoCompleteMultiple';
import { videoConferenceQueryKeys } from '../../../../lib/queryKeys';
import { useCallRingPreference } from '../../hooks/useCallPreferences';

type AddParticipantsModalProps = {
	callId: string;
	rid: string;
	onClose: () => void;
};

type AddParticipantsFormValues = {
	users: string[];
};

const AddParticipantsModal = ({ callId, rid, onClose }: AddParticipantsModalProps) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const dispatchToastMessage = useToastMessageDispatch();

	const { control, handleSubmit, watch } = useForm<AddParticipantsFormValues>({ defaultValues: { users: [] } });

	const { users } = watch();

	// The same habit the preflight remembers, asked here for the same reason: a ring is an interruption, and
	// someone added so they can join later is not someone to interrupt now.
	//
	// Deliberately not a form field: it is remembered across calls and shared with the preflight, so the stored
	// preference is the value. A copy of it in the form would have to be written back on every change, and the
	// two could then disagree about what this user's habit is.
	const { ring, toggleRing } = useCallRingPreference();

	// Present only for participants who can read the chat: a member added from outside the room has no room
	// here, and must still be able to add people.
	const room = useUserRoom(rid);

	const addParticipants = useEndpoint('POST', '/v1/video-conference.add-participants');

	// Members of the room are left out of the options: they can already join, so adding them would be a no-op.
	// Everyone else is offerable — that is the point, since membership doesn't require room access.
	// DMs expose their members on the room doc; other room types come from the members endpoint.
	const getMembers = useEndpoint('GET', room && isPrivateRoom(room) ? '/v1/groups.members' : '/v1/channels.members');
	// 100 is the members endpoints' own page size, and this asks for one page rather than paging the whole room.
	// So in a room with more members than that, some of them are still offered as options. That is a redundant
	// option rather than a wrong outcome: the server skips anyone already associated with the call, and the toast
	// below says as much. Paging every member of a large room to tidy up a picker isn't worth the requests.
	const membersQuery = useQuery({
		enabled: !!room && !isDirectMessageRoom(room),
		queryKey: ['conference', 'add-participants', 'members', rid, room?.t],
		queryFn: () => getMembers({ roomId: rid, count: 100 }),
	});

	const memberUsernames = useMemo(() => {
		// Asked of the room rather than carried in a flag: `usernames` is optional on a room and required on a
		// direct one, so the narrowing is what says this list exists at all.
		if (room && isDirectMessageRoom(room)) {
			return room.usernames;
		}

		return (membersQuery.data?.members ?? [])
			.map((member) => member.username)
			.filter((username): username is string => typeof username === 'string');
	}, [room, membersQuery.data]);

	// Adding makes them members of the *conference*, which is what lets them join the call — it deliberately
	// puts them in no room. Whether they can read the chat is surfaced separately, once it matters, rather
	// than being decided here. The server rings everyone added, unless told not to.
	const addParticipantsMutation = useMutation({
		mutationFn: addParticipants,
		onSuccess: ({ added }) => {
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
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
	});

	const handleAdd = ({ users }: AddParticipantsFormValues) => addParticipantsMutation.mutate({ callId, users, ring });

	return (
		<GenericModal
			icon={null}
			title={t('Add_people')}
			confirmText={t('Add')}
			confirmDisabled={!users.length}
			confirmLoading={addParticipantsMutation.isPending}
			wrapperFunction={(props) => <Box is='form' onSubmit={handleSubmit(handleAdd)} {...props} />}
			onCancel={onClose}
		>
			<FieldGroup>
				<Field>
					{/* The label is the package's, which is what names the picker: it used to be named by an
					    `aria-label` nobody could see, over a placeholder that is gone the moment anything is typed. */}
					<FieldLabel>{t('People')}</FieldLabel>
					<FieldRow>
						{/* The product's own way of picking people, the same as adding them to a room — this used to be
						    hand-rolled here, down to the chips and the remove buttons. */}
						<Controller
							control={control}
							name='users'
							render={({ field }) => <UserAutoCompleteMultiple {...field} exceptions={memberUsernames} placeholder={t('Choose_users')} />}
						/>
					</FieldRow>
				</Field>
				{/* Under the names, because it is a question about the people just chosen. */}
				<Field>
					<FieldRow justifyContent='flex-start'>
						<CheckBox checked={ring} onChange={toggleRing} />
						<Box marginInlineStart={8}>
							<FieldLabel>{t('Ring_people')}</FieldLabel>
						</Box>
					</FieldRow>
				</Field>
			</FieldGroup>
		</GenericModal>
	);
};

export default AddParticipantsModal;
