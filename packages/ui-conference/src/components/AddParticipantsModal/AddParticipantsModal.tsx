import { RING_RECIPIENTS_LIMIT } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { CheckBox, Field, FieldError, FieldGroup, FieldLabel, FieldRow } from '@rocket.chat/fuselage-forms';
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
};

/**
 * Associates people with the call, which is what lets them join it — and deliberately puts them in no room.
 *
 * Whether they can read the chat is surfaced separately, once it matters, rather than being decided here.
 */
const AddParticipantsModal = ({ onClose }: AddParticipantsModalProps) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const { addParticipants } = useConferenceActions();
	const { renderUserPicker } = useConferenceSlots();

	const {
		control,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm<AddParticipantsFormValues>({ defaultValues: { users: [] }, mode: 'onChange' });

	const { users } = watch();

	// The endpoint takes at most `RING_RECIPIENTS_LIMIT` at a time and refuses the whole body past that, so a
	// picker that went on accepting names was collecting a selection it could only fail to send.
	const tooMany = users.length > RING_RECIPIENTS_LIMIT;

	// The same habit the preflight remembers, asked here for the same reason: a ring is an interruption, and
	// someone added so they can join later is not someone to interrupt now.
	//
	// Deliberately not a form field: it is remembered across calls and shared with the preflight, so the stored
	// preference is the value. A copy of it in the form would have to be written back on every change, and the
	// two could then disagree about what this user's habit is.
	const { ring, toggleRing } = useCallRingPreference();

	// The same permission the server checks before it honours `ring`: without it the request is accepted and the
	// ringing quietly dropped, so offering the choice would promise a call nobody's phone is going to make.
	const { canRingUsers } = useConferenceViewer();

	const [adding, setAdding] = useState(false);

	const handleAdd = ({ users }: AddParticipantsFormValues) => {
		setAdding(true);

		void addParticipants(users, canRingUsers && ring)
			.then(({ added }) => {
				// Anyone already associated with the call is skipped, so a selection can come back empty. Reporting
				// that as success would claim people were called who never were.
				dispatchToastMessage(
					added ? { type: 'success', message: t('Users_added') } : { type: 'info', message: t('Selected_users_are_already_in_the_call') },
				);

				onClose();
			})
			.catch((error) => {
				dispatchToastMessage({ type: 'error', message: error });
				setAdding(false);
			});
	};

	return (
		<GenericModal
			icon={null}
			title={t('Add_people')}
			confirmText={t('Add')}
			confirmDisabled={!users.length || tooMany}
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
