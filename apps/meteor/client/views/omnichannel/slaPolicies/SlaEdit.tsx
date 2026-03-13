import type { IOmnichannelServiceLevelAgreements, Serialized } from '@rocket.chat/core-typings';
import { Field, FieldLabel, FieldRow, FieldError, TextInput, Button, Margins, Box, NumberInput } from '@rocket.chat/fuselage';
import { ContextualbarScrollableContent } from '@rocket.chat/ui-client';
import { useToastMessageDispatch, useRoute, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useId } from 'react';
import { useController, useForm } from 'react-hook-form';

type SlaEditProps = {
	isNew?: boolean;
	slaId?: string;
	reload: () => void;
	data?: Serialized<IOmnichannelServiceLevelAgreements>;
};

type SlaEditFormData = {
	name: string;
	description?: string;
	dueTimeInMinutes: number;
};

function SlaEdit({ data, isNew, slaId, reload, ...props }: SlaEditProps): ReactElement {
	const slasRoute = useRoute('omnichannel-sla-policies');
	const saveSLA = useEndpoint('POST', '/v1/livechat/sla');
	const updateSLA = useEndpoint('PUT', `/v1/livechat/sla/:slaId`, { slaId: slaId || '' });
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const {
		control,
		formState: { errors, isDirty },
		handleSubmit,
		reset,
	} = useForm<SlaEditFormData>({
		mode: 'onSubmit',
		defaultValues: {
			name: data?.name || '',
			description: data?.description || '',
			dueTimeInMinutes: data?.dueTimeInMinutes || 0,
		},
	});

	const { field: nameField } = useController({
		control,
		name: 'name',
		rules: { required: t('Required_field', { field: t('Name') }) },
	});

	const { field: dueTimeField } = useController({
		control,
		name: 'dueTimeInMinutes',
		rules: {
			validate(value) {
				return Number(value || 0) <= 0 ? t('Required_field', { field: t('Estimated_wait_time_in_minutes') }) : true;
			},
		},
	});

	const { field: descField } = useController({ control, name: 'description' });

	const nameFieldId = useId();
	const descFieldId = useId();
	const dueTimeFieldId = useId();

	const handleSave = async ({ name, description, dueTimeInMinutes }: SlaEditFormData) => {
		try {
			const payload = { name, description, dueTimeInMinutes: Number(dueTimeInMinutes) };
			if (slaId) {
				await updateSLA(payload);
			} else {
				await saveSLA(payload);
			}

			dispatchToastMessage({ type: 'success', message: t('Saved') });
			reload();
			slasRoute.push({});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	return (
		<ContextualbarScrollableContent is='form' onSubmit={handleSubmit(handleSave)} {...props}>
			<Field>
				<FieldLabel htmlFor={nameFieldId}>{t('Name')}*</FieldLabel>
				<FieldRow>
					<TextInput
						id={nameFieldId}
						placeholder={t('Name')}
						flexGrow={1}
						{...nameField}
						aria-describedby={`${nameFieldId}-error`}
						aria-invalid={Boolean(errors.name?.message)}
						error={errors.name?.message}
					/>
				</FieldRow>
				{errors.name && (
					<FieldError role='alert' id={`${nameFieldId}-error`}>
						{errors.name.message}
					</FieldError>
				)}
			</Field>
			<Field>
				<FieldLabel htmlFor={descFieldId}>{t('Description')}</FieldLabel>
				<FieldRow>
					<TextInput id={descFieldId} placeholder={t('Description')} flexGrow={1} {...descField} />
				</FieldRow>
			</Field>
			<Field>
				<FieldLabel htmlFor={dueTimeFieldId}>{t('Estimated_wait_time_in_minutes')}*</FieldLabel>
				<FieldRow>
					<NumberInput
						id={dueTimeFieldId}
						placeholder={t('Estimated_wait_time_in_minutes')}
						flexGrow={1}
						{...dueTimeField}
						aria-describedby={`${dueTimeFieldId}-error`}
						aria-invalid={Boolean(errors.dueTimeInMinutes?.message)}
						error={errors.dueTimeInMinutes?.message}
					/>
				</FieldRow>
				{errors.dueTimeInMinutes && (
					<FieldError role='alert' id={`${dueTimeFieldId}-error`}>
						{errors.dueTimeInMinutes.message}
					</FieldError>
				)}
			</Field>
			<Field>
				<FieldRow>
					<Box display='flex' flexDirection='row' justifyContent='space-between' w='full'>
						<Margins inlineEnd={4}>
							{!isNew && (
								<Button flexGrow={1} type='reset' disabled={!isDirty} onClick={(): void => reset()}>
									{t('Reset')}
								</Button>
							)}
							<Button primary mie='none' type='submit' flexGrow={1} disabled={isNew ? false : !isDirty}>
								{t('Save')}
							</Button>
						</Margins>
					</Box>
				</FieldRow>
			</Field>
		</ContextualbarScrollableContent>
	);
}

export default SlaEdit;
