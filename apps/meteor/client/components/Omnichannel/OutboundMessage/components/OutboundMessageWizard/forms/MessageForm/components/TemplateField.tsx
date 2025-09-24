import type { IOutboundProviderTemplate, Serialized } from '@rocket.chat/core-typings';
import { Field, FieldError, FieldHint, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps } from 'react';
import { useId } from 'react';
import type { Control } from 'react-hook-form';
import { useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { OUTBOUND_DOCS_LINK } from '../../../../../constants';
import TemplateSelect from '../../../../TemplateSelect';
import { cxp } from '../../../utils/cx';
import type { MessageFormData } from '../MessageForm';

type TemplateFieldProps = ComponentProps<typeof Field> & {
	control: Control<MessageFormData>;
	templates: Serialized<IOutboundProviderTemplate>[] | undefined;
	onChange?: (templateId: string) => void;
};

const TemplateField = ({ control, templates, onChange: onChangeExternal, ...props }: TemplateFieldProps) => {
	const { t } = useTranslation();
	const templateFieldId = useId();

	const {
		field: templateField,
		fieldState: { error: templateFieldError },
	} = useController({
		control,
		name: 'templateId',
		rules: {
			validate: {
				// NOTE: The order of these validations matters
				templatesNotFound: () => (!templates?.length ? t('No_templates_available') : true),
				templateNotFound: (templateId) =>
					templateId && !templates?.some((template) => template.id === templateId)
						? t('Error_loading__name__information', { name: t('template') })
						: true,
				required: (value) => (!value?.trim() ? t('Required_field', { field: t('Template_message') }) : true),
			},
		},
	});

	const handleTemplateChange = useEffectEvent((value: string) => {
		onChangeExternal?.(value);
		templateField.onChange(value);
	});

	return (
		<Field {...props}>
			<FieldLabel is='span' required id={templateFieldId}>
				{t('Template')}
			</FieldLabel>
			<FieldRow>
				<TemplateSelect
					aria-labelledby={templateFieldId}
					aria-invalid={!!templateFieldError}
					aria-describedby={cxp(templateFieldId, {
						error: !!templateFieldError,
						hint: true,
					})}
					placeholder={t('Select_template')}
					error={templateFieldError?.message}
					templates={templates || []}
					value={templateField.value}
					onChange={handleTemplateChange}
				/>
			</FieldRow>
			{templateFieldError && (
				<FieldError aria-live='assertive' id={`${templateFieldId}-error`}>
					{templateFieldError.message}
				</FieldError>
			)}
			<FieldHint id={`${templateFieldId}-hint`}>
				<a href={OUTBOUND_DOCS_LINK} target='_blank' rel='noopener noreferrer'>
					{t('Learn_more')}
				</a>
			</FieldHint>
		</Field>
	);
};

export default TemplateField;
