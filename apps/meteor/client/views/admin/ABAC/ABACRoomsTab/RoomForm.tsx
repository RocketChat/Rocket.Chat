import { Box, Callout, Field, FieldLabel, FieldRow, FieldError, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { ContextualbarFooter, ContextualbarScrollableContent } from '@rocket.chat/ui-client';
import type { Dispatch, SetStateAction } from 'react';
import { useId } from 'react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import RoomFormAttributeFields from './RoomFormAttributeFields';
import RoomFormAutocomplete from './RoomFormAutocomplete';
import RoomFormAutocompleteDummy from './RoomFormAutocompleteDummy';
import type { useAbacAttributeEditFlow } from '../../../../components/ABAC/AbacAttributeEditor/useAbacAttributeEditFlow';
import AbacMembershipPreview from '../../../../components/ABAC/AbacMembershipPreview/AbacMembershipPreview';

export type RoomFormProps = {
	onClose: () => void;
	roomInfo?: { rid: string; name: string };
	setSelectedRoomLabel: Dispatch<SetStateAction<string>>;
	redacted?: boolean;
	editFlow: ReturnType<typeof useAbacAttributeEditFlow>;
};

export type RoomFormData = {
	room: string;
	attributes: { key: string; values: string[] }[];
};

const RoomForm = ({ onClose, roomInfo, setSelectedRoomLabel, redacted = false, editFlow }: RoomFormProps) => {
	const {
		control,
		formState: { isValid, errors, isDirty },
	} = useFormContext<RoomFormData>();

	const { t } = useTranslation();
	const formId = useId();
	const nameField = useId();

	const { fields, append, remove } = useFieldArray({
		name: 'attributes',
		control,
	});

	return (
		<>
			<ContextualbarScrollableContent id={formId}>
				{editFlow.phase === 'preview' ? (
					<AbacMembershipPreview
						variant='impact'
						data={editFlow.preview.data}
						isPending={editFlow.preview.isPending}
						error={editFlow.preview.error ?? undefined}
					/>
				) : (
					<>
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
						{redacted && (
							<Box marginBlockEnd={16}>
								<Callout type='warning' title={t('ABAC_Attributes_Redacted')}>
									{t('ABAC_Attributes_Redacted_Description')}
								</Callout>
							</Box>
						)}
						<Box marginBlockEnd={8} color='hint' fontScale='c1'>
							{t('ABAC_Room_attributes_edit_hint')}
						</Box>
						<RoomFormAttributeFields fields={fields} remove={remove} disabled={redacted} />
						<Button
							width='full'
							disabled={redacted || fields.length >= 10}
							onClick={() => {
								append({ key: '', values: [] });
							}}
						>
							{t('ABAC_Add_Attribute')}
						</Button>
					</>
				)}
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					{editFlow.phase === 'preview' ? (
						<>
							<Button onClick={editFlow.backToEdit}>{t('Back')}</Button>
							<Button onClick={editFlow.requestSave} disabled={!editFlow.canSave} loading={editFlow.isSaving} primary>
								{t('Save_changes')}
							</Button>
						</>
					) : (
						<>
							<Button onClick={onClose}>{t('Cancel')}</Button>
							<Button onClick={editFlow.goToPreview} disabled={redacted || !isValid || !isDirty} primary>
								{t('Next')}
							</Button>
						</>
					)}
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default RoomForm;
