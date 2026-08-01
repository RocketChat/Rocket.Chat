import type { UserStatus } from '@rocket.chat/core-typings';
import {
	AutoComplete,
	Box,
	Button,
	Field,
	FieldDescription,
	FieldRow,
	IconButton,
	Modal,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterControllers,
	ModalHeader,
	ModalHeaderText,
	ModalTitle,
	Option,
	StatusBullet,
} from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Rooms } from '../../stores';

type SelectedParticipant = { username: string; name: string; status?: UserStatus };

type AddParticipantsModalProps = {
	callId: string;
	rid: string;
	onClose: () => void;
};

const AddParticipantsModal = ({ callId, rid, onClose }: AddParticipantsModalProps) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [filter, setFilter] = useState('');
	const [selected, setSelected] = useState<SelectedParticipant[]>([]);
	const [adding, setAdding] = useState(false);
	const debouncedFilter = useDebouncedValue(filter, 300);

	// The room is already loaded into the store by the conference chat panel (ConferenceRoomPreload).
	const room = Rooms.use((state) => state.get(rid));
	const isPrivate = room?.t === 'p';
	const isDirect = room?.t === 'd';

	const getUsers = useEndpoint('GET', '/v1/users.autocomplete');
	const addParticipants = useEndpoint('POST', '/v1/video-conference.add-participants');

	// Members of the room are excluded from the autocomplete: they can already join, so adding them would be
	// a no-op. Everyone else is offerable — that is the point, since membership doesn't require room access.
	// DMs expose their members on the room doc; other room types come from the members endpoint.
	const getMembers = useEndpoint('GET', isPrivate ? '/v1/groups.members' : '/v1/channels.members');
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

	// Only the room's members go into the query key — already-selected users are local state, so they are
	// filtered out of the options below instead of refetching once per selection.
	const usersQuery = useQuery({
		enabled: !!room,
		queryKey: ['conference', 'add-participants', 'autocomplete', debouncedFilter, memberUsernames],
		queryFn: async () => {
			const { items } = await getUsers({ selector: JSON.stringify({ term: debouncedFilter, exceptions: memberUsernames }) });
			return items;
		},
		placeholderData: keepPreviousData,
	});

	const options = useMemo(() => {
		const selectedUsernames = new Set(selected.map((participant) => participant.username));

		return (usersQuery.data ?? [])
			.filter((user) => !selectedUsernames.has(user.username))
			.map((user) => ({ value: user.username, label: user.name || user.username, status: user.status }));
	}, [usersQuery.data, selected]);

	const handleSelect = (value: string | string[]) => {
		if (Array.isArray(value)) {
			return;
		}

		const option = options.find((current) => current.value === value);
		if (!option) {
			return;
		}

		setSelected((prev) =>
			prev.some((current) => current.username === option.value)
				? prev
				: [...prev, { username: option.value, name: option.label, status: option.status }],
		);
		setFilter('');
	};

	const handleRemove = (username: string) => setSelected((prev) => prev.filter((participant) => participant.username !== username));

	// Adding makes them members of the *conference*, which is what lets them join the call — it deliberately
	// puts them in no room. Whether they can read the chat is surfaced separately, once it matters, rather
	// than being decided here. The server rings everyone added.
	const handleAdd = async () => {
		if (!selected.length) {
			return;
		}
		setAdding(true);
		try {
			await addParticipants({ callId, users: selected.map((participant) => participant.username) });

			dispatchToastMessage({ type: 'success', message: t('Users_added') });
			onClose();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			setAdding(false);
		}
	};

	return (
		<Modal>
			<ModalHeader>
				<ModalHeaderText>
					<ModalTitle>{t('Add_participants')}</ModalTitle>
				</ModalHeaderText>
				<ModalClose title={t('Close')} onClick={onClose} />
			</ModalHeader>
			<ModalContent>
				<Field>
					<FieldRow>
						<AutoComplete
							value={undefined}
							filter={filter}
							setFilter={setFilter}
							onChange={handleSelect}
							options={options}
							renderSelected={() => null}
							renderItem={({ value, label, ...props }) => {
								const option = options.find((current) => current.value === value);
								return (
									<Option
										key={value}
										{...props}
										label={
											<Box display='flex' alignItems='center'>
												<StatusBullet status={option?.status} />
												<Box marginInlineStart={8}>{label}</Box>
											</Box>
										}
										avatar={<UserAvatar username={String(value)} size='x20' />}
									/>
								);
							}}
						/>
					</FieldRow>
					<FieldDescription>{t('Choose_users')}</FieldDescription>
				</Field>

				{selected.length > 0 && (
					<Box marginBlockStart={16} display='flex' flexDirection='column'>
						{selected.map((participant) => (
							<Box key={participant.username} display='flex' alignItems='center' paddingBlock={8}>
								<UserAvatar username={participant.username} size='x28' />
								<Box marginInlineStart={8} display='flex' alignItems='center'>
									<StatusBullet status={participant.status} />
								</Box>
								<Box marginInlineStart={8} flexGrow={1} fontScale='p2b' withTruncatedText>
									{participant.name}
								</Box>
								<IconButton icon='cross' small title={t('Remove')} onClick={() => handleRemove(participant.username)} />
							</Box>
						))}
					</Box>
				)}
			</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button primary loading={adding} disabled={!selected.length} onClick={handleAdd}>
						{t('Add')}
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default AddParticipantsModal;
