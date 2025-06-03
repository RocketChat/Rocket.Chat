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
import { useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useId } from 'react';
import type { ReactElement } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { goToRoomById } from '../../lib/utils/goToRoomById';
import RoomAutoComplete from '../RoomAutoComplete';
import UserAutoCompleteMultiple from '../UserAutoCompleteMultiple';
import DefaultParentRoomField from './DefaultParentRoomField';

type CreateDiscussionFormValues = {
	name: string;
	parentRoom: IRoom['_id'];
	encrypted: boolean;
	usernames: Array<IUser['username']>;
	firstMessage: string;
	topic: string;
};

type CreateDiscussionProps = {
	parentMessageId?: IMessage['_id'];
	onClose: () => void;
	defaultParentRoom?: IRoom['_id'];
	nameSuggestion?: string;
};

// TODO: Replace `Modal` in favor of `GenericModal`
const CreateDiscussion = ({ onClose, defaultParentRoom, parentMessageId, nameSuggestion }: CreateDiscussionProps): ReactElement => {
	const t = useTranslation();

	const {
		formState: { errors },
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
			topic: '',
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

	const handleCreate = async ({ name, parentRoom, encrypted, usernames, firstMessage, topic }: CreateDiscussionFormValues) => {
		createDiscussionMutation.mutate({
			prid: defaultParentRoom || parentRoom,
			t_name: name,
			users: usernames,
			reply: encrypted ? undefined : firstMessage,
			topic,
			...(parentMessageId && { pmid: parentMessageId }),
		});
	};

	const parentRoomId = useId();
	const encryptedId = useId();
	const discussionNameId = useId();
	const membersId = useId();
	const firstMessageId = useId();
	const topicId = useId();
	const modalId = useId();

	return (
		<Modal
			aria-labelledby={`${modalId}-title`}
			wrapperFunction={(props) => <Box is='form' onSubmit={handleSubmit(handleCreate)} {...props} />}
		>
			<Modal.Header>
				<Modal.Title id={`${modalId}-title`}>{t('Discussion_title')}</Modal.Title>
				<Modal.Close tabIndex={-1} onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Box mbe={24}>{t('Discussion_description')}</Box>
				<FieldGroup>
					<Field>
						<FieldLabel htmlFor={parentRoomId} required>
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
									rules={{ required: t('Required_field', { field: t('Discussion_target_channel') }) }}
									render={({ field: { name, onBlur, onChange, value } }) => (
										<RoomAutoComplete
											name={name}
											onBlur={onBlur}
											onChange={onChange}
											value={value}
											id={parentRoomId}
											placeholder={t('Search_options')}
											disabled={Boolean(defaultParentRoom)}
											aria-invalid={Boolean(errors.parentRoom)}
											aria-required='true'
											aria-describedby={`${parentRoomId}-error`}
										/>
									)}
								/>
							)}
						</FieldRow>
						{errors.parentRoom && (
							<FieldError aria-live='assertive' id={`${parentRoomId}-error`}>
								{errors.parentRoom.message}
							</FieldError>
						)}
					</Field>
					<Field>
						<FieldLabel htmlFor={discussionNameId} required>
							{t('Name')}
						</FieldLabel>
						<FieldRow>
							<Controller
								name='name'
								control={control}
								rules={{ required: t('Required_field', { field: t('Name') }) }}
								render={({ field }) => (
									<TextInput
										id={discussionNameId}
										{...field}
										aria-invalid={Boolean(errors.name)}
										aria-required='true'
										aria-describedby={`${discussionNameId}-error ${discussionNameId}-hint`}
										addon={<Icon name='baloons' size='x20' />}
									/>
								)}
							/>
						</FieldRow>
						{errors.name && (
							<FieldError aria-live='assertive' id={`${discussionNameId}-error`}>
								{errors.name.message}
							</FieldError>
						)}
					</Field>
					<Field>
						<FieldLabel htmlFor={topicId}>{t('Topic')}</FieldLabel>
						<FieldRow>
							<Controller
								name='topic'
								control={control}
								render={({ field }) => <TextInput id={topicId} {...field} aria-describedby={`${topicId}-hint`} />}
							/>
						</FieldRow>
						<FieldRow>
							<FieldHint id={`${topicId}-hint`}>{t('Displayed_next_to_name')}</FieldHint>
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel htmlFor={membersId}>{t('Members')}</FieldLabel>
						<FieldRow>
							<Controller
								control={control}
								name='usernames'
								render={({ field: { name, onChange, value, onBlur } }) => (
									<UserAutoCompleteMultiple
										id={membersId}
										name={name}
										onChange={onChange}
										value={value}
										onBlur={onBlur}
										placeholder={t('Add_people')}
									/>
								)}
							/>
						</FieldRow>
					</Field>
					<Field>
						<FieldLabel htmlFor={firstMessageId}>{t('Discussion_first_message_title')}</FieldLabel>
						<FieldRow>
							<Controller
								control={control}
								name='firstMessage'
								render={({ field }) => (
									<TextAreaInput
										id={firstMessageId}
										{...field}
										rows={5}
										disabled={encrypted}
										aria-describedby={`${firstMessageId}-hint ${firstMessageId}-encrypted-hint`}
									/>
								)}
							/>
						</FieldRow>
						{encrypted ? (
							<FieldHint id={`${firstMessageId}-encrypted-hint`}>{t('Discussion_first_message_disabled_due_to_e2e')}</FieldHint>
						) : (
							<FieldHint id={`${firstMessageId}-hint`}>{t('First_message_hint')}</FieldHint>
						)}
					</Field>
					<Field>
						<FieldRow>
							<FieldLabel htmlFor={encryptedId}>{t('Encrypted')}</FieldLabel>
							<Controller
								control={control}
								name='encrypted'
								render={({ field: { value, ...field } }) => <ToggleSwitch id={encryptedId} {...field} checked={value} />}
							/>
						</FieldRow>
						{encrypted ? (
							<FieldHint id={`${encryptedId}-hint`}>{t('Encrypted_messages', { roomType: 'discussion' })}</FieldHint>
						) : (
							<FieldHint id={`${encryptedId}-hint`}>{t('Encrypted_messages_false')}</FieldHint>
						)}
					</Field>
				</FieldGroup>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button type='submit' primary loading={createDiscussionMutation.isPending}>
						{t('Create')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default CreateDiscussion;
