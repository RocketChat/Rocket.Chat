import { Field, FieldError, FieldHint, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps } from 'react';
import { useId } from 'react';
import type { Control } from 'react-hook-form';
import { useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import AutoCompleteDepartment from '../../../../../../AutoCompleteDepartment';
import RetryButton from '../../../components/RetryButton';
import { cxp } from '../../../utils/cx';
import type { RepliesFormData } from '../RepliesForm';

type DepartmentFieldProps = ComponentProps<typeof Field> & {
	control: Control<RepliesFormData>;
	onlyMyDepartments?: boolean;
	isError: boolean;
	isFetching: boolean;
	onRefetch: () => void;
	onChange: () => void;
};

const DepartmentField = ({
	control,
	onlyMyDepartments,
	isError,
	isFetching,
	onRefetch,
	onChange: onChangeExternal,
	...props
}: DepartmentFieldProps) => {
	const { t } = useTranslation();
	const departmentFieldId = useId();

	const {
		field: departmentField,
		fieldState: { error: departmentFieldError },
	} = useController({
		control,
		name: 'departmentId',
		rules: {
			validate: () => (isError ? t('Error_loading__name__information', { name: t('department') }) : true),
		},
	});

	const handleDepartmentChange = useEffectEvent((onChange: (value: string) => void) => {
		return (value: string) => {
			onChangeExternal();
			onChange(value);
		};
	});

	return (
		<Field {...props}>
			<FieldLabel is='span' id={departmentFieldId}>{`${t('Department')} (${t('optional')})`}</FieldLabel>
			<FieldRow>
				<AutoCompleteDepartment
					name={departmentField.name}
					aria-invalid={!!departmentFieldError}
					aria-labelledby={departmentFieldId}
					aria-describedby={cxp(departmentFieldId, {
						error: !!departmentFieldError,
						hint: true,
					})}
					error={departmentFieldError?.message}
					placeholder={t('Select_department')}
					onlyMyDepartments={onlyMyDepartments}
					value={departmentField.value}
					onChange={handleDepartmentChange(departmentField.onChange)}
				/>
			</FieldRow>
			{departmentFieldError && (
				<FieldError aria-live='assertive' id={`${departmentFieldId}-error`} display='flex' alignItems='center'>
					{departmentFieldError.message}
					{isError && <RetryButton loading={isFetching} onClick={onRefetch} />}
				</FieldError>
			)}
			<FieldHint id={`${departmentFieldId}-hint`}>{t('Outbound_message_department_hint')}</FieldHint>
		</Field>
	);
};

export default DepartmentField;
