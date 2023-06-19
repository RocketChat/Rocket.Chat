import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { Modal, Field, FieldGroup, ToggleSwitch, TextInput, TextAreaInput, Button, Icon, Box } from '@rocket.chat/fuselage';
import { useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import type { ComponentProps, ReactElement } from 'react';
import React from 'react';
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
		register,
		formState: { isDirty, errors },
		handleSubmit,
		control,
		watch,
	} = useForm({
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

	return (
		<Modal
			data-qa='create-discussion-modal'
			wrapperFunction={(props: ComponentProps<typeof Box>) => <Box is='form' onSubmit={handleSubmit(handleCreate)} {...props} />}
		>
			<Modal.Header>
				<Modal.Title>{t('Discussion_title')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<FieldGroup>
					<Field>
						<Field.Description>{t('Discussion_description')}</Field.Description>
					</Field>
					<Field>
						<Field.Label>{t('Discussion_target_channel')}</Field.Label>
						<Field.Row>
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
									rules={{ required: t('Field_required') }}
									render={({ field: { onChange, value } }) => (
										<RoomAutoComplete
											value={value}
											onChange={onChange}
											placeholder={t('Discussion_target_channel_description')}
											disabled={Boolean(defaultParentRoom)}
										/>
									)}
								/>
							)}
						</Field.Row>
						{errors.parentRoom && <Field.Error>{errors.parentRoom.message}</Field.Error>}
					</Field>
					<Field display='flex' alignItems='center' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
						<Box display='flex' flexDirection='column' width='full'>
							<Field.Label>{t('Encrypted')}</Field.Label>
						</Box>
						<Controller
							control={control}
							name='encrypted'
							render={({ field: { onChange, value } }) => (
								<ToggleSwitch
									checked={value}
									onChange={onChange}
									aria-describedby='Encrypted_discussion_Description'
									aria-labelledby='Encrypted_discussion_Label'
								/>
							)}
						/>
					</Field>
					<Field>
						<Field.Label>{t('Discussion_name')}</Field.Label>
						<Field.Row>
							<TextInput
								{...register('name', { required: t('Field_required') })}
								placeholder={t('New_discussion_name')}
								addon={<Icon name='baloons' size='x20' />}
							/>
						</Field.Row>
						{errors.name && <Field.Error>{errors.name.message}</Field.Error>}
					</Field>
					<Field>
						<Field.Label>{t('Invite_Users')}</Field.Label>
						<Field.Row w='full' display='flex' flexDirection='column' alignItems='stretch'>
							<Controller
								control={control}
								name='usernames'
								render={({ field: { onChange, value } }) => (
									<UserAutoCompleteMultiple value={value} onChange={onChange} placeholder={t('Username_Placeholder')} />
								)}
							/>
						</Field.Row>
					</Field>
					<Field>
						<Field.Label>{t('Discussion_first_message_title')}</Field.Label>
						<Field.Row>
							<TextAreaInput {...register('firstMessage')} placeholder={t('New_discussion_first_message')} rows={5} disabled={encrypted} />
						</Field.Row>
						{encrypted && <Field.Description>{t('Discussion_first_message_disabled_due_to_e2e')}</Field.Description>}
					</Field>
				</FieldGroup>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button type='submit' primary disabled={!isDirty || createDiscussionMutation.isLoading}>
						{t('Create')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default CreateDiscussion;
