import { Box, Field, FieldLabel, FieldRow, FieldError, ButtonGroup, Button, ContextualbarFooter } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { GenericModal, ContextualbarScrollableContent } from '@rocket.chat/ui-client';
import { useSetModal } from '@rocket.chat/ui-contexts';
import type { Dispatch, SetStateAction } from 'react';
import { useId } from 'react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import RoomFormAttributeFields from './RoomFormAttributeFields';
import RoomFormAutocomplete from './RoomFormAutocomplete';
import RoomFormAutocompleteDummy from './RoomFormAutocompleteDummy';

type RoomFormProps = {
	onClose: () => void;
	onSave: (data: RoomFormData) => void;
	roomInfo?: { rid: string; name: string };
	setSelectedRoomLabel: Dispatch<SetStateAction<string>>;
};

export type RoomFormData = {
	room: string;
	attributes: { key: string; values: string[] }[];
};

const RoomForm = ({ onClose, onSave, roomInfo, setSelectedRoomLabel }: RoomFormProps) => {
	const {
		control,
		handleSubmit,
		formState: { isValid, errors, isDirty },
	} = useFormContext<RoomFormData>();

	const { t } = useTranslation();
	const formId = useId();
	const nameField = useId();

	const { fields, append, remove } = useFieldArray({
		name: 'attributes',
		control,
	});

	const setModal = useSetModal();

	const updateAction = useEffectEvent(async (action: () => void) => {
		setModal(
			<GenericModal
				variant='info'
				icon={null}
				title={t('ABAC_Update_room_confirmation_modal_title')}
				annotation={t('ABAC_Update_room_confirmation_modal_annotation')}
				confirmText={t('Save_changes')}
				onConfirm={() => {
					action();
					setModal(null);
				}}
				onCancel={() => setModal(null)}
			>
				<Trans
					i18nKey='ABAC_Update_room_content'
					values={{ roomName: roomInfo?.name }}
					components={{ bold: <Box is='span' fontWeight='bold' /> }}
				/>
			</GenericModal>,
		);
	});

	const handleSave = useEffectEvent(() => {
		if (roomInfo) {
			updateAction(handleSubmit(onSave));
		} else {
			handleSubmit(onSave)();
		}
	});

	return (
		<>
			<ContextualbarScrollableContent is='form' onSubmit={handleSubmit(handleSave)} id={formId}>
				<Field>
					<FieldLabel id={nameField} required>
						{t('ABAC_Room_to_be_managed')}
					</FieldLabel>
					<FieldRow>
						{roomInfo ? (
							<RoomFormAutocompleteDummy roomInfo={roomInfo} />
						) : (
							<Controller
								name='room'
								control={control}
								rules={{ required: t('Required_field', { field: t('ABAC_Room_to_be_managed') }) }}
								render={({ field }) => (
									<RoomFormAutocomplete
										{...field}
										error={!!errors.room?.message}
										aria-labelledby={nameField}
										aria-required='true'
										aria-invalid={errors.room ? 'true' : 'false'}
										aria-describedby={`${nameField}-error`}
										onSelectedRoom={(value: string, label: string) => {
											field.onChange(value);
											setSelectedRoomLabel(label);
										}}
									/>
								)}
							/>
						)}
					</FieldRow>
					{errors.room && (
						<FieldError id={`${nameField}-error`} role='alert'>
							{errors.room.message}
						</FieldError>
					)}
				</Field>
				<RoomFormAttributeFields fields={fields} remove={remove} />
				<Button
					w='full'
					disabled={fields.length >= 10}
					onClick={() => {
						append({ key: '', values: [] });
					}}
				>
					{t('ABAC_Add_Attribute')}
				</Button>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button type='submit' form={formId} disabled={!isValid || !isDirty} primary>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default RoomForm;
