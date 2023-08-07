import type { IOmnichannelServiceLevelAgreements, Serialized } from '@rocket.chat/core-typings';
import { Field, TextInput, Button, Margins, Box, NumberInput } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useRoute, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';
import { useController, useForm } from 'react-hook-form';

import { ContextualbarScrollableContent } from '../../../../client/components/Contextualbar';

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
		rules: { required: t('The_field_is_required', t('Name')) },
	});

	const { field: dueTimeField } = useController({
		control,
		name: 'dueTimeInMinutes',
		rules: {
			validate(value) {
				return Number(value || 0) <= 0 ? t('The_field_is_required', t('Estimated_wait_time_in_minutes')) : true;
			},
		},
	});

	const { field: descField } = useController({ control, name: 'description' });

	const handleSave = useMutableCallback(async () => {
		const { name, description, dueTimeInMinutes } = getValues();

		if (!isValid || !name || dueTimeInMinutes === undefined) {
			return dispatchToastMessage({ type: 'error', message: t('The_field_is_required') });
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
				<Field.Label>{t('Name')}*</Field.Label>
				<Field.Row>
					<TextInput placeholder={t('Name')} flexGrow={1} {...nameField} error={errors.name?.message} />
				</Field.Row>
				<Field.Error>{errors.name?.message}</Field.Error>
			</Field>
			<Field>
				<Field.Label>{t('Description')}</Field.Label>
				<Field.Row>
					<TextInput placeholder={t('Description')} flexGrow={1} {...descField} />
				</Field.Row>
			</Field>
			<Field>
				<Field.Label>{t('Estimated_wait_time_in_minutes')}*</Field.Label>
				<Field.Row>
					<NumberInput
						placeholder={t('Estimated_wait_time_in_minutes')}
						flexGrow={1}
						{...dueTimeField}
						error={errors.dueTimeInMinutes?.message}
					/>
				</Field.Row>
				<Field.Error>{errors.dueTimeInMinutes?.message}</Field.Error>
			</Field>
			<Field.Row>
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
			</Field.Row>
		</ContextualbarScrollableContent>
	);
}

export default SlaEdit;
