import { Field, FieldLabel, FieldRow, FieldError } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useController } from 'react-hook-form';

import type { AuditFields } from '../../hooks/useAuditForm';
import RoomAutoComplete from '../forms/RoomAutoComplete';

type RoomsTabProps = {
	form: UseFormReturn<AuditFields>;
};

const RoomsTab = ({ form: { control } }: RoomsTabProps): ReactElement => {
	const { field: ridField, fieldState: ridFieldState } = useController({ name: 'rid', control, rules: { required: true } });

	const t = useTranslation();

	return (
		<Field flexShrink={1}>
			<FieldLabel>{t('Channel_name')}</FieldLabel> {/* TODO: should it be `Room_name`? */}
			<FieldRow>
				<RoomAutoComplete
					value={ridField.value}
					error={!!ridFieldState.error}
					placeholder={t('Channel_Name_Placeholder')}
					onChange={ridField.onChange}
				/>
			</FieldRow>
			{ridFieldState.error?.type === 'required' && <FieldError>{t('The_field_is_required', t('Channel_name'))}</FieldError>}
			{ridFieldState.error?.type === 'validate' && <FieldError>{ridFieldState.error.message}</FieldError>}
		</Field>
	);
};

export default RoomsTab;
