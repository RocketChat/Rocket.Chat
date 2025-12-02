import { Box, Field, FieldLabel, FieldRow, FieldError, ButtonGroup, Button, ContextualbarFooter } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { GenericModal } from '@rocket.chat/ui-client';
import { useSetModal } from '@rocket.chat/ui-contexts';
import type { Dispatch, SetStateAction } from 'react';
import { useId } from 'react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import ABACAttributeField from './ABACAttributeField';
import ABACRoomAutocomplete from './ABACRoomAutocomplete';
import ABACRoomAutocompleteDummy from './ABACRoomAutocompleteDummy';
import { ContextualbarScrollableContent } from '../../../components/Contextualbar';

type AdminABACRoomFormProps = {
	onClose: () => void;
	onSave: (data: AdminABACRoomFormData) => void;
	roomInfo?: { rid: string; name: string };
	setSelectedRoomLabel: Dispatch<SetStateAction<string>>;
};

export type AdminABACRoomFormData = {
	room: string;
	attributes: { key: string; values: string[] }[];
};

const AdminABACRoomForm = ({ onClose, onSave, roomInfo, setSelectedRoomLabel }: AdminABACRoomFormProps) => {
	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useFormContext<AdminABACRoomFormData>();

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
			<ContextualbarScrollableContent>
				<Box is='form' onSubmit={handleSubmit(handleSave)} id={formId}>
					<Field mb={16}>
						<FieldLabel id={nameField} required>
							{t('ABAC_Room_to_be_managed')}
						</FieldLabel>
						<FieldRow>
							{roomInfo ? (
								<ABACRoomAutocompleteDummy roomInfo={roomInfo} />
							) : (
								<Controller
									name='room'
									control={control}
									rules={{ required: t('Required_field', { field: t('ABAC_Room_to_be_managed') }) }}
									render={({ field }) => (
										<ABACRoomAutocomplete
											{...field}
											error={!!errors.room?.message}
											aria-labelledby={nameField}
											onSelectedRoom={(value: string, label: string) => {
												field.onChange(value);
												setSelectedRoomLabel(label);
											}}
										/>
									)}
								/>
							)}
						</FieldRow>
						<FieldError>{errors.room?.message}</FieldError>
					</Field>
					{fields.map((field, index) => (
						<Field key={field.id} mb={16}>
							<FieldLabel htmlFor={field.id} required>
								{t('Attribute')}
							</FieldLabel>
							<ABACAttributeField
								onRemove={() => {
									remove(index);
								}}
								index={index}
							/>
						</Field>
					))}
					<Button
						w='full'
						disabled={fields.length >= 10}
						onClick={() => {
							append({ key: '', values: [] });
						}}
					>
						{t('ABAC_Add_Attribute')}
					</Button>
				</Box>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button type='submit' form={formId} disabled={!!errors.room?.message} primary>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default AdminABACRoomForm;
