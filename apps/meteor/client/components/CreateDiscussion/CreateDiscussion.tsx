import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { Icon, Box } from '@rocket.chat/fuselage';
import {
	Field,
	FieldGroup,
	ToggleSwitch,
	TextInput,
	TextAreaInput,
	FieldHint,
	FieldLabel,
	FieldRow,
	FieldError,
} from '@rocket.chat/fuselage-forms';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { GenericModal } from '@rocket.chat/ui-client';
import { useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { useEncryptedRoomDescription } from '../../navbar/NavBarPagesGroup/actions/useEncryptedRoomDescription';
import { useGoToRoom } from '../../views/room/hooks/useGoToRoom';
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
	encryptedParentRoom?: boolean;
	onClose: () => void;
	defaultParentRoom?: IRoom['_id'];
	nameSuggestion?: string;
};

const CreateDiscussion = ({
	onClose,
	defaultParentRoom,
	parentMessageId,
	nameSuggestion,
	encryptedParentRoom = false,
}: CreateDiscussionProps) => {
	const t = useTranslation();

	const [encryptedDisabled, setEncryptedDisabled] = useState(encryptedParentRoom);

	const {
		formState: { errors },
		handleSubmit,
		control,
		watch,
		setValue,
	} = useForm({
		defaultValues: {
			name: nameSuggestion || '',
			parentRoom: '',
			encrypted: encryptedParentRoom,
			usernames: [],
			firstMessage: '',
			topic: '',
		},
	});

	const onParentRoomChange = useEffectEvent((room: IRoom | undefined) => {
		if (!room) {
			return;
		}
		setValue('encrypted', room.encrypted === true);
		setEncryptedDisabled(room.encrypted === true);
	});

	const { encrypted } = watch();

	const createDiscussion = useEndpoint('POST', '/v1/rooms.createDiscussion');

	const goToRoom = useGoToRoom();

	const createDiscussionMutation = useMutation({
		mutationFn: createDiscussion,
		onSuccess: ({ discussion }) => {
			goToRoom(discussion._id);
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

	const getEncryptedHint = useEncryptedRoomDescription('discussion');

	return (
		<GenericModal
			variant='warning'
			icon={null}
			title={t('Discussion_title')}
			onCancel={onClose}
			wrapperFunction={(props) => <Box is='form' onSubmit={handleSubmit(handleCreate)} {...props} />}
			confirmText={t('Create')}
			cancelText={t('Cancel')}
			confirmLoading={createDiscussionMutation.isPending}
		>
			<Box mbe={24}>{t('Discussion_description')}</Box>
			<FieldGroup>
				<Field>
					<FieldLabel required>{t('Discussion_target_channel')}</FieldLabel>
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
								render={({ field }) => (
									<RoomAutoComplete
										{...field}
										error={Boolean(errors.parentRoom?.message)}
										placeholder={t('Search_options')}
										disabled={Boolean(defaultParentRoom)}
										aria-required='true'
										setSelectedRoom={onParentRoomChange}
										renderRoomIcon={({ encrypted }) => (encrypted ? <Icon name='key' /> : null)}
									/>
								)}
							/>
						)}
					</FieldRow>
					{errors.parentRoom && <FieldError>{errors.parentRoom.message}</FieldError>}
				</Field>
				<Field>
					<FieldLabel required>{t('Name')}</FieldLabel>
					<FieldRow>
						<Controller
							name='name'
							control={control}
							rules={{ required: t('Required_field', { field: t('Name') }) }}
							render={({ field }) => (
								<TextInput {...field} aria-required='true' addon={<Icon name='baloons' size='x20' />} error={errors.name?.message} />
							)}
						/>
					</FieldRow>
					{errors.name && <FieldError>{errors.name.message}</FieldError>}
				</Field>
				<Field>
					<FieldLabel>{t('Topic')}</FieldLabel>
					<FieldRow>
						<Controller name='topic' control={control} render={({ field }) => <TextInput {...field} error={errors.topic?.message} />} />
					</FieldRow>
					<FieldRow>
						<FieldHint>{t('Displayed_next_to_name')}</FieldHint>
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel>{t('Members')}</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='usernames'
							render={({ field }) => <UserAutoCompleteMultiple {...field} placeholder={t('Add_people')} />}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldLabel>{t('Discussion_first_message_title')}</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='firstMessage'
							render={({ field }) => <TextAreaInput {...field} rows={5} disabled={encrypted} />}
						/>
					</FieldRow>
					{encrypted ? (
						<FieldHint>{t('Discussion_first_message_disabled_due_to_e2e')}</FieldHint>
					) : (
						<FieldHint>{t('First_message_hint')}</FieldHint>
					)}
				</Field>
				<Field>
					<FieldRow>
						<FieldLabel>{t('Encrypted')}</FieldLabel>
						<Controller
							control={control}
							name='encrypted'
							render={({ field: { value, ...field } }) => <ToggleSwitch {...field} checked={value} disabled={encryptedDisabled} />}
						/>
					</FieldRow>
					<FieldHint>{getEncryptedHint({ isPrivate: true, encrypted })}</FieldHint>
				</Field>
			</FieldGroup>
		</GenericModal>
	);
};

export default CreateDiscussion;
