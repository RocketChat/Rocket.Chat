import type { IOmnichannelServiceLevelAgreements, Serialized } from '@rocket.chat/core-typings';
import { Field, FieldLabel, FieldRow, FieldError, TextInput, Button, Margins, Box, NumberInput } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useRoute, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useController, useForm } from 'react-hook-form';

import { ContextualbarScrollableContent } from '../../components/Contextualbar';

type SlaEditProps = {
	isNew?: boolean;
	slaId?: string;
	reload: () => void;
	data?: Serialized<IOmnichannelServiceLevelAgreements>;
};

function SlaEdit({ data, isNew, slaId, reload, ...props }: SlaEditProps): ReactElement {
	const slasRoute = useRoute('omnichannel-sla-policies');
	const saveSLA = useEndpoint('POST', '/v1/livechat/sla');
	const updateSLA = useEndpoint('PUT', `/v1/livechat/sla/:slaId`, { slaId: slaId || '' });
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();

	const { name, description, dueTimeInMinutes } = data || {};

	const {
		control,
		getValues,
		formState: { errors, isValid, isDirty },
		reset,
	} = useForm({
		mode: 'onChange',
		defaultValues: { name, description, dueTimeInMinutes },
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

	const handleSave = useEffectEvent(async () => {
		const { name, description, dueTimeInMinutes } = getValues();

		if (!isValid || !name || dueTimeInMinutes === undefined) {
			return dispatchToastMessage({ type: 'error', message: t('Required_field') });
		}

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
	});

	return (
		<ContextualbarScrollableContent is='form' {...props}>
			<Field>
				<FieldLabel>{t('Name')}*</FieldLabel>
				<FieldRow>
					<TextInput placeholder={t('Name')} flexGrow={1} {...nameField} error={errors.name?.message} />
				</FieldRow>
				<FieldError>{errors.name?.message}</FieldError>
			</Field>
			<Field>
				<FieldLabel>{t('Description')}</FieldLabel>
				<FieldRow>
					<TextInput placeholder={t('Description')} flexGrow={1} {...descField} />
				</FieldRow>
			</Field>
			<Field>
				<FieldLabel>{t('Estimated_wait_time_in_minutes')}*</FieldLabel>
				<FieldRow>
					<NumberInput
						placeholder={t('Estimated_wait_time_in_minutes')}
						flexGrow={1}
						{...dueTimeField}
						error={errors.dueTimeInMinutes?.message}
					/>
				</FieldRow>
				<FieldError>{errors.dueTimeInMinutes?.message}</FieldError>
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
							<Button primary mie='none' flexGrow={1} disabled={!isDirty || !isValid} onClick={handleSave}>
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
