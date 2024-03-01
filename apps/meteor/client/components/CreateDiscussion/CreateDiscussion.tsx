import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import {
	Modal,
	Field,
	FieldGroup,
	ToggleSwitch,
	TextInput,
	TextAreaInput,
	Button,
	Icon,
	Box,
	FieldHint,
	FieldLabel,
	FieldRow,
	FieldError,
} from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { RoomAutoComplete, UserAutoCompleteMultiple } from '@rocket.chat/ui-client';
import { useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React from 'react';
import { useForm, Controller } from 'react-hook-form';

import { goToRoomById } from '../../lib/utils/goToRoomById';
import DefaultParentRoomField from './DefaultParentRoomField';

type CreateDiscussionFormValues = {
	name: string;
	parentRoom: IRoom['_id'];
	encrypted: boolean;
	usernames: Array<IUser['username']>;
	firstMessage: string;
};

type CreateDiscussionProps = {
	parentMessageId?: IMessage['_id'];
	onClose: () => void;
	defaultParentRoom?: IRoom['_id'];
	nameSuggestion?: string;
};

const CreateDiscussion = ({ onClose, defaultParentRoom, parentMessageId, nameSuggestion }: CreateDiscussionProps): ReactElement => {
	const t = useTranslation();

	const {
		formState: { isDirty, isSubmitting, isValidating, errors },
		handleSubmit,
		control,
		watch,
	} = useForm({
		mode: 'onBlur',
		defaultValues: {
			name: nameSuggestion || '',
			parentRoom: '',
			encrypted: false,
			usernames: [],
			firstMessage: '',
		},
	});

	const { encrypted } = watch();

	const createDiscussion = useEndpoint('POST', '/v1/rooms.createDiscussion');

	const createDiscussionMutation = useMutation({
		mutationFn: createDiscussion,
		onSuccess: ({ discussion }) => {
			goToRoomById(discussion._id);
			onClose();
		},
	});

	const handleCreate = async ({ name, parentRoom, encrypted, usernames, firstMessage }: CreateDiscussionFormValues) => {
		createDiscussionMutation.mutate({
			prid: defaultParentRoom || parentRoom,
			t_name: name,
			users: usernames,
			reply: encrypted ? undefined : firstMessage,
			...(parentMessageId && { pmid: parentMessageId }),
		});
	};

	const targetChannelField = useUniqueId();
	const encryptedField = useUniqueId();
	const discussionField = useUniqueId();
	const usersField = useUniqueId();
	const firstMessageField = useUniqueId();

	return (
		<Modal
			data-qa='create-discussion-modal'
			wrapperFunction={(props) => <Box is='form' onSubmit={handleSubmit(handleCreate)} {...props} />}
		>
			<Modal.Header>
				<Modal.Title>{t('Discussion_title')}</Modal.Title>
				<Modal.Close tabIndex={-1} onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Box mbe={24}>{t('Discussion_description')}</Box>
				<FieldGroup>
					<Field>
						<FieldLabel htmlFor={targetChannelField} required>
							{t('Discussion_target_channel')}
						</FieldLabel>
						<FieldRow>
							{defaultParentRoom && (
								<Controller
									control={control}
									name='parentRoom'
									render={() => <DefaultParentRoomField defaultParentRoom={defaultParentRoom} />}
								/>
							)}
							{!defaultParentRoom && (
								<Controller
									control={control}
									name='parentRoom'
									rules={{ required: t('error-the-field-is-required', { field: t('Discussion_target_channel') }) }}
									render={({ field: { name, onBlur, onChange, value } }) => (
										<RoomAutoComplete
											name={name}
											onBlur={onBlur}
											onChange={onChange}
											value={value}
											id={targetChannelField}
											placeholder={t('Discussion_target_channel_description')}
											disabled={Boolean(defaultParentRoom)}
											aria-invalid={Boolean(errors.parentRoom)}
											aria-required='true'
											aria-describedby={`${targetChannelField}-error`}
										/>
									)}
								/>
							)}
						</FieldRow>
						{errors.parentRoom && (
							<FieldError aria-live='assertive' id={`${targetChannelField}-error`}>
								{errors.parentRoom.message}
							</FieldError>
						)}
					</Field>
					<Field>
						<FieldRow>
							<FieldLabel htmlFor={encryptedField}>{t('Encrypted')}</FieldLabel>
							<Controller
								control={control}
								name='encrypted'
								render={({ field: { value, ...field } }) => <ToggleSwitch id={encryptedField} {...field} checked={value} />}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel htmlFor={discussionField} required>
							{t('Discussion_name')}
						</FieldLabel>
						<FieldRow>
							<Controller
								name='name'
								control={control}
								rules={{ required: t('Field_required') }}
								render={({ field }) => (
									<TextInput
										id={discussionField}
										{...field}
										placeholder={t('New_discussion_name')}
										aria-invalid={Boolean(errors.name)}
										aria-required='true'
										aria-describedby={`${discussionField}-error`}
										addon={<Icon name='baloons' size='x20' />}
									/>
								)}
							/>
						</FieldRow>
						{errors.name && (
							<FieldError aria-live='assertive' id={`${discussionField}-error`}>
								{errors.name.message}
							</FieldError>
						)}
					</Field>
					<Field>
						<FieldLabel htmlFor={usersField}>{t('Invite_Users')}</FieldLabel>
						<FieldRow>
							<Controller
								control={control}
								name='usernames'
								render={({ field: { name, onChange, value, onBlur } }) => (
									<UserAutoCompleteMultiple
										id={usersField}
										name={name}
										onChange={onChange}
										value={value}
										onBlur={onBlur}
										placeholder={t('Username_Placeholder')}
									/>
								)}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel htmlFor={firstMessageField}>{t('Discussion_first_message_title')}</FieldLabel>
						<FieldRow>
							<Controller
								control={control}
								name='firstMessage'
								render={({ field }) => (
									<TextAreaInput
										id={firstMessageField}
										{...field}
										placeholder={t('New_discussion_first_message')}
										rows={5}
										disabled={encrypted}
										aria-describedby={`${firstMessageField}-hint`}
									/>
								)}
							/>
						</FieldRow>
						{encrypted && <FieldHint id={`${firstMessageField}-hint`}>{t('Discussion_first_message_disabled_due_to_e2e')}</FieldHint>}
					</Field>
				</FieldGroup>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button type='submit' primary disabled={!isDirty} loading={isSubmitting || isValidating}>
						{t('Create')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default CreateDiscussion;
