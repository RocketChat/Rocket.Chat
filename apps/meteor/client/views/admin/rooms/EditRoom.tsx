import type { IRoom, RoomAdminFieldsType } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import {
	Box,
	Button,
	ButtonGroup,
	TextInput,
	Field,
	FieldLabel,
	FieldRow,
	FieldHint,
	ToggleSwitch,
	TextAreaInput,
	FieldError,
} from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useRouter, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useId } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useEditAdminRoomPermissions } from './useEditAdminRoomPermissions';
import { ContextualbarScrollableContent, ContextualbarFooter } from '../../../components/Contextualbar';
import RoomAvatarEditor from '../../../components/avatar/RoomAvatarEditor';
import { getDirtyFields } from '../../../lib/getDirtyFields';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import { useArchiveRoom } from '../../hooks/roomActions/useArchiveRoom';
import { useDeleteRoom } from '../../hooks/roomActions/useDeleteRoom';

type EditRoomProps = {
	room: IRoom;
	onChange: () => void;
	onDelete: () => void;
};

type EditRoomFormData = {
	roomName: IRoom['name'];
	roomTopic: string;
	roomType: IRoom['t'];
	readOnly: boolean;
	isDefault: boolean;
	favorite: boolean;
	featured: boolean;
	reactWhenReadOnly: boolean;
	roomDescription: string;
	roomAnnouncement: string;
	roomAvatar: IRoom['avatarETag'];
	archived: boolean;
};

const getInitialValues = (room: Pick<IRoom, RoomAdminFieldsType>): EditRoomFormData => ({
	roomName: room.t === 'd' ? room.usernames?.join(' x ') : roomCoordinator.getRoomName(room.t, room),
	roomType: room.t,
	readOnly: !!room.ro,
	archived: !!room.archived,
	isDefault: !!room.default,
	favorite: !!room.favorite,
	featured: !!room.featured,
	reactWhenReadOnly: !!room.reactWhenReadOnly,
	roomTopic: room.topic ?? '',
	roomDescription: room.description ?? '',
	roomAnnouncement: room.announcement ?? '',
	roomAvatar: undefined,
});

const EditRoom = ({ room, onChange, onDelete }: EditRoomProps) => {
	const { t } = useTranslation();
	const router = useRouter();
	const dispatchToastMessage = useToastMessageDispatch();

	const {
		control,
		watch,
		reset,
		handleSubmit,
		formState: { isDirty, errors, dirtyFields },
	} = useForm<EditRoomFormData>({ values: getInitialValues(room) });

	const {
		canViewName,
		canViewTopic,
		canViewAnnouncement,
		canViewArchived,
		canViewDescription,
		canViewType,
		canViewReadOnly,
		canViewReactWhenReadOnly,
	} = useEditAdminRoomPermissions(room);

	const { roomType, readOnly, archived, isDefault } = watch();

	const changeArchiving = archived !== !!room.archived;

	const { handleDelete, canDeleteRoom, isDeleting } = useDeleteRoom(room, { reload: onDelete });

	const saveAction = useEndpoint('POST', '/v1/rooms.saveRoomSettings');

	const handleArchive = useArchiveRoom(room);

	const handleUpdateRoomData = useEffectEvent(async ({ isDefault, favorite, ...formData }: EditRoomFormData) => {
		const data = getDirtyFields(formData, dirtyFields);
		delete data.archived;

		try {
			await saveAction({
				...data,
				rid: room._id,
				default: isDefault,
				favorite: { defaultValue: isDefault, favorite },
			});

			dispatchToastMessage({ type: 'success', message: t('Room_updated_successfully') });
			onChange();
			router.navigate('/admin/rooms');
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const handleSave = useEffectEvent((data: EditRoomFormData) =>
		Promise.all([isDirty && handleUpdateRoomData(data), changeArchiving && handleArchive()].filter(Boolean)),
	);

	const formId = useId();
	const roomNameField = useId();
	const ownerField = useId();
	const roomDescription = useId();
	const roomAnnouncement = useId();
	const roomTopicField = useId();
	const roomTypeField = useId();
	const readOnlyField = useId();
	const reactWhenReadOnly = useId();
	const archivedField = useId();
	const isDefaultField = useId();
	const favoriteField = useId();
	const featuredField = useId();

	return (
		<>
			<ContextualbarScrollableContent id={formId} is='form' onSubmit={handleSubmit(handleSave)}>
				{room.t !== 'd' && (
					<Box pbe={24} display='flex' justifyContent='center'>
						<Controller
							name='roomAvatar'
							control={control}
							render={({ field: { value, onChange } }) => (
								<RoomAvatarEditor disabled={isRoomFederated(room)} roomAvatar={value} room={room} onChangeAvatar={onChange} />
							)}
						/>
					</Box>
				)}
				<Field>
					<FieldLabel htmlFor={roomNameField} required>
						{t('Name')}
					</FieldLabel>
					<FieldRow>
						<Controller
							name='roomName'
							rules={{ required: t('Required_field', { field: t('Name') }) }}
							control={control}
							render={({ field }) => (
								<TextInput
									id={roomNameField}
									{...field}
									disabled={isDeleting || !canViewName}
									aria-required={true}
									aria-invalid={Boolean(errors?.roomName)}
									aria-describedby={`${roomNameField}-error`}
								/>
							)}
						/>
					</FieldRow>
					{errors?.roomName && (
						<FieldError aria-live='assertive' id={`${roomNameField}-error`}>
							{errors.roomName.message}
						</FieldError>
					)}
				</Field>
				{room.t !== 'd' && (
					<>
						{room.u && (
							<Field>
								<FieldLabel htmlFor={ownerField}>{t('Owner')}</FieldLabel>
								<FieldRow>
									<TextInput id={ownerField} name='roomOwner' readOnly value={room.u?.username} />
								</FieldRow>
							</Field>
						)}
						{canViewDescription && (
							<Field>
								<FieldLabel htmlFor={roomDescription}>{t('Description')}</FieldLabel>
								<FieldRow>
									<Controller
										name='roomDescription'
										control={control}
										render={({ field }) => (
											<TextAreaInput id={roomDescription} {...field} rows={4} disabled={isDeleting || isRoomFederated(room)} />
										)}
									/>
								</FieldRow>
							</Field>
						)}
						{canViewAnnouncement && (
							<Field>
								<FieldLabel htmlFor={roomAnnouncement}>{t('Announcement')}</FieldLabel>
								<FieldRow>
									<Controller
										name='roomAnnouncement'
										control={control}
										render={({ field }) => (
											<TextAreaInput id={roomAnnouncement} {...field} rows={4} disabled={isDeleting || isRoomFederated(room)} />
										)}
									/>
								</FieldRow>
							</Field>
						)}
						{canViewTopic && (
							<Field>
								<FieldLabel htmlFor={roomTopicField}>{t('Topic')}</FieldLabel>
								<FieldRow>
									<Controller
										name='roomTopic'
										control={control}
										render={({ field }) => <TextAreaInput id={roomTopicField} {...field} rows={4} disabled={isDeleting} />}
									/>
								</FieldRow>
							</Field>
						)}
						{canViewType && (
							<Field>
								<FieldRow>
									<FieldLabel htmlFor={roomTypeField}>{t('Private')}</FieldLabel>
									<Controller
										name='roomType'
										control={control}
										render={({ field: { value, onChange, ...field } }) => (
											<ToggleSwitch
												{...field}
												id={roomTypeField}
												disabled={isDeleting || isRoomFederated(room)}
												checked={roomType === 'p'}
												onChange={() => onChange(value === 'p' ? 'c' : 'p')}
												aria-describedby={`${roomTypeField}-hint`}
											/>
										)}
									/>
								</FieldRow>
								<FieldHint id={`${roomTypeField}-hint`}>{t('Just_invited_people_can_access_this_channel')}</FieldHint>
							</Field>
						)}
						{canViewReadOnly && (
							<Field>
								<FieldRow>
									<FieldLabel htmlFor={readOnlyField}>{t('Read_only')}</FieldLabel>
									<Controller
										name='readOnly'
										control={control}
										render={({ field: { value, ...field } }) => (
											<ToggleSwitch
												id={readOnlyField}
												{...field}
												disabled={isDeleting || isRoomFederated(room)}
												checked={value}
												aria-describedby={`${readOnlyField}-hint`}
											/>
										)}
									/>
								</FieldRow>
								<FieldHint id={`${readOnlyField}-hint`}>{t('Only_authorized_users_can_write_new_messages')}</FieldHint>
							</Field>
						)}
						{canViewReactWhenReadOnly && readOnly && (
							<Field>
								<FieldRow>
									<FieldLabel htmlFor={reactWhenReadOnly}>{t('React_when_read_only')}</FieldLabel>
									<Controller
										name='reactWhenReadOnly'
										control={control}
										render={({ field: { value, ...field } }) => (
											<ToggleSwitch
												id={reactWhenReadOnly}
												{...field}
												checked={value || isRoomFederated(room)}
												aria-describedby={`${reactWhenReadOnly}-hint`}
											/>
										)}
									/>
								</FieldRow>
								<FieldHint id={`${reactWhenReadOnly}-hint`}>{t('React_when_read_only_changed_successfully')}</FieldHint>
							</Field>
						)}
						{canViewArchived && (
							<Field>
								<FieldRow>
									<FieldLabel htmlFor={archivedField}>{t('Room_archivation_state_true')}</FieldLabel>
									<Controller
										name='archived'
										control={control}
										render={({ field: { value, ...field } }) => (
											<ToggleSwitch id={archivedField} {...field} disabled={isDeleting || isRoomFederated(room)} checked={value} />
										)}
									/>
								</FieldRow>
							</Field>
						)}
					</>
				)}
				<Field>
					<FieldRow>
						<FieldLabel htmlFor={isDefaultField}>{t('Default')}</FieldLabel>
						<Controller
							name='isDefault'
							control={control}
							render={({ field: { value, ...field } }) => (
								<ToggleSwitch id={isDefaultField} {...field} disabled={isDeleting || isRoomFederated(room)} checked={value} />
							)}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldRow>
						<FieldLabel htmlFor={favoriteField}>{t('Favorite')}</FieldLabel>
						<Controller
							name='favorite'
							control={control}
							render={({ field: { value, ...field } }) => (
								<ToggleSwitch id={favoriteField} {...field} disabled={isDeleting || !isDefault} checked={value} />
							)}
						/>
					</FieldRow>
				</Field>
				<Field>
					<FieldRow>
						<FieldLabel htmlFor={featuredField}>{t('Featured')}</FieldLabel>
						<Controller
							name='featured'
							control={control}
							render={({ field: { value, ...field } }) => (
								<ToggleSwitch id={featuredField} {...field} disabled={isDeleting || isRoomFederated(room)} checked={value} />
							)}
						/>
					</FieldRow>
				</Field>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button type='reset' disabled={!isDirty || isDeleting} onClick={() => reset()}>
						{t('Reset')}
					</Button>
					<Button form={formId} type='submit' disabled={!isDirty || isDeleting}>
						{t('Save')}
					</Button>
				</ButtonGroup>
				<Box mbs={8}>
					<ButtonGroup stretch>
						<Button icon='trash' danger loading={isDeleting} disabled={!canDeleteRoom || isRoomFederated(room)} onClick={handleDelete}>
							{t('Delete')}
						</Button>
					</ButtonGroup>
				</Box>
			</ContextualbarFooter>
		</>
	);
};

export default EditRoom;
