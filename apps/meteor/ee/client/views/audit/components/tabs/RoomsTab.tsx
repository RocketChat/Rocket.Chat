import { Field } from '@rocket.chat/fuselage';
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
			<Field.Label>{t('Channel_name')}</Field.Label> {/* TODO: should it be `Room_name`? */}
			<Field.Row>
				<RoomAutoComplete
					value={ridField.value}
					error={!!ridFieldState.error}
					placeholder={t('Channel_Name_Placeholder')}
					onChange={ridField.onChange}
				/>
			</Field.Row>
			{ridFieldState.error?.type === 'required' && <Field.Error>{t('The_field_is_required', t('Channel_name'))}</Field.Error>}
			{ridFieldState.error?.type === 'validate' && <Field.Error>{ridFieldState.error.message}</Field.Error>}
		</Field>
	);
};

export default RoomsTab;
