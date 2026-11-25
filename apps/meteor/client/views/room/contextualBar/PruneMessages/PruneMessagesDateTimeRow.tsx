import { InputBox, Stack } from '@rocket.chat/fuselage';
import { Field, FieldError, FieldLabel } from '@rocket.chat/fuselage-forms';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { PruneMessagesFormValues } from './PruneMessagesWithData';

export type PruneMessagesDateTimeRowProps = {
	label: string;
	field: 'newer' | 'older';
	validate?: (values: PruneMessagesFormValues) => string | true;
	className?: string;
};

const PruneMessagesDateTimeRow = ({ label, field, validate, className }: PruneMessagesDateTimeRowProps) => {
	const {
		register,
		formState: { errors },
	} = useFormContext<PruneMessagesFormValues>();
	const { t } = useTranslation();

	const error = errors[field]?.date?.message;
	const dateRules = validate
		? { validate: (_: string, values: PruneMessagesFormValues) => validate(values) }
		: { deps: 'older.date' as const };

	return (
		<Field className={className}>
			<FieldLabel>{label}</FieldLabel>
			<Stack direction='row' gap={8}>
				<InputBox
					aria-label={`${label} ${t('Date')}`}
					aria-invalid={Boolean(error)}
					type='date'
					{...register(`${field}.date`, dateRules)}
				/>
				<InputBox aria-label={`${label} ${t('Time')}`} type='time' {...register(`${field}.time`, { deps: 'older.date' })} />
			</Stack>
			{error && <FieldError>{error}</FieldError>}
		</Field>
	);
};

export default PruneMessagesDateTimeRow;
