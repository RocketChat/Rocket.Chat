import { Box, Field, FieldLabel, FieldRow, FieldError, ButtonGroup, Button, ContextualbarFooter } from '@rocket.chat/fuselage';
import { useId } from 'react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import ABACAttributeAutocomplete from './ABACAttributeAutocomplete';
import ABACRoomAutocomplete from './ABACRoomAutocomplete';
import { ContextualbarScrollableContent } from '../../../components/Contextualbar';

type AdminABACRoomFormProps = {
	onClose: () => void;
	onSave: (data: unknown) => void;
};

const AdminABACRoomForm = ({ onClose, onSave }: AdminABACRoomFormProps) => {
	const {
		control,
		handleSubmit,
		formState: { errors },
		setValue,
	} = useFormContext();
	const { t } = useTranslation();
	const formId = useId();
	const nameField = useId();

	const { fields, append, remove } = useFieldArray({
		name: 'attributes',
		control,
	});

	return (
		<>
			<ContextualbarScrollableContent>
				<Box is='form' onSubmit={handleSubmit(onSave)} id={formId}>
					<Field mb={16}>
						<FieldLabel htmlFor={nameField} required>
							{t('ABAC_Room_to_be_managed')}
						</FieldLabel>
						<FieldRow>
							<Controller name='room' control={control} render={({ field }) => <ABACRoomAutocomplete {...field} />} />
						</FieldRow>
						<FieldError>{errors.room?.message || ''}</FieldError>
					</Field>
					{fields.map((field, index) => (
						<Field key={field.id} mb={16}>
							<FieldLabel htmlFor={field.id} required>
								{t('Attribute')}
							</FieldLabel>
							<FieldRow>
								{/* TODO: Check if there is a better way to hanlde the change in the attribute value */}
								<ABACAttributeAutocomplete
									control={control}
									onRemove={() => {
										remove(index);
									}}
									index={index}
									setValue={setValue}
								/>
							</FieldRow>
						</Field>
					))}
					<Button
						w='full'
						disabled={fields.length + fields.length >= 10}
						onClick={() => {
							append({ value: '' });
						}}
					>
						{t('ABAC_Add_Attribute')}
					</Button>
				</Box>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button onClick={handleSubmit(onSave)}>{t('Save')}</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default AdminABACRoomForm;
