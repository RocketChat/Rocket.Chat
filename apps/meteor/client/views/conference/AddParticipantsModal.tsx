import type { RoomType, UserStatus } from '@rocket.chat/core-typings';
import {
	AutoComplete,
	Box,
	Button,
	Field,
	FieldDescription,
	FieldRow,
	Icon,
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
import { useEndpoint, useMethod, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

// Mirrors the VoIP widget's PeerAutocomplete: a typed value becomes a synthetic top option so the
// user can add a raw phone number that isn't a known user.
const PREFIX_FIRST_OPTION = 'rcx-first-option-';
const isFirstOption = (value: string) => value.startsWith(PREFIX_FIRST_OPTION);

type AutocompleteUser = { _id: string; username: string; name?: string; status?: UserStatus };

type SelectedParticipant = { kind: 'user'; username: string; name: string; status?: UserStatus } | { kind: 'number'; number: string };

const keyOf = (participant: SelectedParticipant) =>
	participant.kind === 'user' ? `user:${participant.username}` : `number:${participant.number}`;

type AddParticipantsModalProps = {
	type: RoomType;
	reference: string;
	onClose: () => void;
};

const AddParticipantsModal = ({ type, reference, onClose }: AddParticipantsModalProps) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [filter, setFilter] = useState('');
	const [selected, setSelected] = useState<SelectedParticipant[]>([]);
	const [adding, setAdding] = useState(false);
	const debouncedFilter = useDebouncedValue(filter, 300);

	const getRoomByTypeAndName = useMethod('getRoomByTypeAndName');
	const getUsers = useEndpoint('GET', '/v1/users.autocomplete');
	const inviteToChannel = useEndpoint('POST', '/v1/channels.invite');
	const inviteToGroup = useEndpoint('POST', '/v1/groups.invite');

	const roomQuery = useQuery({
		queryKey: ['conference', 'add-participants', 'room', type, reference],
		queryFn: () => getRoomByTypeAndName(type, reference),
	});

	const rid = roomQuery.data?._id;
	const isPrivate = roomQuery.data?.t === 'p';

	// Exclude users already in the room from the autocomplete so they can't be selected again.
	const getMembers = useEndpoint('GET', isPrivate ? '/v1/groups.members' : '/v1/channels.members');
	const membersQuery = useQuery({
		enabled: !!rid,
		queryKey: ['conference', 'add-participants', 'members', rid],
		queryFn: () => getMembers({ roomId: rid as string, count: 100 }),
	});

	const memberUsernames = useMemo(
		() => (membersQuery.data?.members ?? []).map((member) => member.username).filter((username): username is string => !!username),
		[membersQuery.data],
	);

	const selectedUsernames = useMemo(
		() => selected.flatMap((participant) => (participant.kind === 'user' ? [participant.username] : [])),
		[selected],
	);

	const exceptions = useMemo(() => [...memberUsernames, ...selectedUsernames], [memberUsernames, selectedUsernames]);

	const usersQuery = useQuery({
		enabled: !!rid,
		queryKey: ['conference', 'add-participants', 'autocomplete', debouncedFilter, exceptions],
		queryFn: async () => {
			const { items } = await getUsers({ selector: JSON.stringify({ term: debouncedFilter, exceptions }) });
			return items as AutocompleteUser[];
		},
		placeholderData: keepPreviousData,
	});

	const options = useMemo(() => {
		const userOptions = (usersQuery.data ?? []).map((user) => ({
			value: user.username,
			label: user.name || user.username,
			status: user.status,
		}));

		// Offer the typed text as a phone number, just like the VoIP dial input.
		if (debouncedFilter.length > 0) {
			return [{ value: `${PREFIX_FIRST_OPTION}${debouncedFilter}`, label: debouncedFilter, status: undefined }, ...userOptions];
		}

		return userOptions;
	}, [usersQuery.data, debouncedFilter]);

	const addParticipant = (participant: SelectedParticipant) => {
		setSelected((prev) => (prev.some((current) => keyOf(current) === keyOf(participant)) ? prev : [...prev, participant]));
		setFilter('');
	};

	const handleSelect = (value: string | string[]) => {
		if (Array.isArray(value)) {
			return;
		}

		if (isFirstOption(value)) {
			addParticipant({ kind: 'number', number: value.replace(PREFIX_FIRST_OPTION, '') });
			return;
		}

		const option = options.find((current) => current.value === value);
		if (!option) {
			return;
		}
		addParticipant({ kind: 'user', username: option.value, name: option.label, status: option.status });
	};

	const handleRemove = (key: string) => setSelected((prev) => prev.filter((participant) => keyOf(participant) !== key));

	const handleAdd = async () => {
		if (!rid || !selected.length) {
			return;
		}
		setAdding(true);
		try {
			// Phone numbers aren't wired into the room yet; only invite the selected users for now.
			const usersToInvite = selected.flatMap((participant) => (participant.kind === 'user' ? [participant.username] : []));
			await Promise.all(
				usersToInvite.map((username) =>
					isPrivate ? inviteToGroup({ roomId: rid, username }) : inviteToChannel({ roomId: rid, username }),
				),
			);
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
								if (isFirstOption(value)) {
									return <Option key={value} {...props} label={label} icon='phone-out' />;
								}

								const option = options.find((current) => current.value === value);
								return (
									<Option
										key={value}
										{...props}
										label={
											<Box display='flex' alignItems='center'>
												<StatusBullet status={option?.status} />
												<Box mis={8}>{label}</Box>
											</Box>
										}
										avatar={<UserAvatar username={String(value)} size='x20' />}
									/>
								);
							}}
						/>
					</FieldRow>
					<FieldDescription>{t('Enter_username_or_number')}</FieldDescription>
				</Field>

				{selected.length > 0 && (
					<Box mbs={16} display='flex' flexDirection='column'>
						{selected.map((participant) => (
							<Box key={keyOf(participant)} display='flex' alignItems='center' pb={8}>
								{participant.kind === 'user' ? (
									<>
										<UserAvatar username={participant.username} size='x28' />
										<Box mis={8} display='flex' alignItems='center'>
											<StatusBullet status={participant.status} />
										</Box>
										<Box mis={8} flexGrow={1} fontScale='p2b' withTruncatedText>
											{participant.name || participant.username}
										</Box>
									</>
								) : (
									<>
										<Box display='flex' alignItems='center' justifyContent='center' width={28} height={28}>
											<Icon name='phone-out' size='x20' />
										</Box>
										<Box mis={8} flexGrow={1} fontScale='p2b' withTruncatedText>
											{participant.number}
										</Box>
									</>
								)}
								<IconButton icon='cross' small title={t('Remove')} onClick={() => handleRemove(keyOf(participant))} />
							</Box>
						))}
					</Box>
				)}
			</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button primary loading={adding} disabled={!rid || !selected.length} onClick={handleAdd}>
						{t('Add')}
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default AddParticipantsModal;
