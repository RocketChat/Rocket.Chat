import { RING_RECIPIENTS_LIMIT } from '@rocket.chat/core-typings';
import { Box, TextInput } from '@rocket.chat/fuselage';
import { CheckBox, Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldRow } from '@rocket.chat/fuselage-forms';
import { GenericModal } from '@rocket.chat/ui-client';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useConferenceActions, useConferenceSlots, useConferenceViewer } from '../../context/ConferenceContext';
import { useCallRingPreference } from '../../hooks/useCallDevicesInitialState';

type AddParticipantsModalProps = {
	onClose: () => void;
};

type AddParticipantsFormValues = {
	users: string[];
	/** Numbers or SIP addresses to call into the conference, separated by commas. */
	destinations: string;
	/** Whether the people added get the chat as it stands, or a fresh one started for the call. */
	keepHistory: boolean;
};

const parseDestinations = (value: string): string[] =>
	value
		.split(',')
		.map((destination) => destination.trim())
		.filter(Boolean);

/**
 * Associates people with the call, which is what lets them join it — and deliberately puts them in no room.
 *
 * Whether they can read the chat is surfaced separately, once it matters, rather than being decided here.
 */
const AddParticipantsModal = ({ onClose }: AddParticipantsModalProps) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const { addParticipants, shareChat, dialOut } = useConferenceActions();
	const { renderUserPicker } = useConferenceSlots();

	const {
		control,
		handleSubmit,
		register,
		watch,
		formState: { errors },
	} = useForm<AddParticipantsFormValues>({
		defaultValues: { users: [], destinations: '', keepHistory: true },
		mode: 'onChange',
	});

	const { users, destinations } = watch();

	// The endpoint refuses the whole body past `RING_RECIPIENTS_LIMIT`.
	const tooMany = users.length > RING_RECIPIENTS_LIMIT;

	// Not a form field: the stored preference is the value, shared with the preflight, so the two cannot disagree.
	const { ring, toggleRing } = useCallRingPreference();

	// The permission the server checks before honouring `ring`: without it the request is accepted and dropped.
	const { canRingUsers } = useConferenceViewer();

	const [adding, setAdding] = useState(false);

	const handleAdd = ({ users, destinations, keepHistory }: AddParticipantsFormValues) => {
		setAdding(true);

		parseDestinations(destinations).forEach((destination) => dialOut?.(destination));

		void (async () => {
			const { added } = users.length ? await addParticipants(users, canRingUsers && ring) : { added: 0 };

			// Membership lets them into the call; it puts them in no room, so the chat is asked for separately.
			if (users.length) {
				await shareChat(keepHistory ? 'invite' : 'discussion', users);
			}

			// Anyone already associated is skipped, so a selection can come back empty.
			dispatchToastMessage(
				added || !users.length
					? { type: 'success', message: t('Users_added') }
					: { type: 'info', message: t('Selected_users_are_already_in_the_call') },
			);

			onClose();
		})().catch((error) => {
			dispatchToastMessage({ type: 'error', message: error });
			setAdding(false);
		});
	};

	return (
		<GenericModal
			icon={null}
			title={t('Add_people')}
			confirmText={t('Add')}
			confirmDisabled={(!users.length && !parseDestinations(destinations).length) || tooMany}
			confirmLoading={adding}
			wrapperFunction={(props) => <Box is='form' onSubmit={handleSubmit(handleAdd)} {...props} />}
			onCancel={onClose}
		>
			<FieldGroup>
				<Field>
					{/* The label is the package's, which is what names the picker: it used to be named by an
					    `aria-label` nobody could see, over a placeholder that is gone the moment anything is typed. */}
					<FieldLabel>{t('People')}</FieldLabel>
					<FieldRow>
						{/* The product's own way of picking people, handed in rather than built here — it reads the room to
						    know which names are no use as options, and reading the room is not this frame's business. */}
						<Controller
							control={control}
							name='users'
							rules={{
								validate: (value) =>
									value.length <= RING_RECIPIENTS_LIMIT || t('Add_at_most__limit__people_at_a_time', { limit: RING_RECIPIENTS_LIMIT }),
							}}
							render={({ field }) => (
								<>
									{renderUserPicker?.({
										value: field.value,
										onChange: field.onChange,
										error: errors.users?.message,
										placeholder: t('Choose_users'),
									})}
								</>
							)}
						/>
					</FieldRow>
					{errors.users && <FieldError>{errors.users.message}</FieldError>}
				</Field>
				{/* A question about the people just chosen, so it sits under them. */}
				{!!users.length && (
					<Field>
						<FieldRow justifyContent='flex-start'>
							<Controller
								control={control}
								name='keepHistory'
								render={({ field: { value, onChange } }) => <CheckBox checked={value} onChange={() => onChange(!value)} />}
							/>
							<Box marginInlineStart={8}>
								<FieldLabel>{t('Keep_chat_history')}</FieldLabel>
							</Box>
						</FieldRow>
						<FieldDescription>{t('Keep_chat_history_Description')}</FieldDescription>
					</Field>
				)}
				{/* Only where the provider can place a call; everywhere else there is nothing to dial with. */}
				{dialOut && (
					<Field>
						<FieldLabel>{t('Phone_Numbers')}</FieldLabel>
						<FieldRow>
							<TextInput {...register('destinations')} placeholder={t('Enter_username_or_number')} />
						</FieldRow>
						<FieldDescription>{t('Dial_numbers_into_the_call_Description')}</FieldDescription>
					</Field>
				)}
				{/* Under the names, because it is a question about the people just chosen. */}
				{canRingUsers && (
					<Field>
						<FieldRow justifyContent='flex-start'>
							<CheckBox checked={ring} onChange={toggleRing} />
							<Box marginInlineStart={8}>
								<FieldLabel>{t('Ring_people')}</FieldLabel>
							</Box>
						</FieldRow>
					</Field>
				)}
			</FieldGroup>
		</GenericModal>
	);
};

export default AddParticipantsModal;
