import { Field } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import RoomAutoComplete from '../../../../audit/RoomAutoComplete';

type RoomsTabProps = {
	errors: Record<string, string>;
	rid: string;
	onChange: (rid: string) => void;
};

const RoomsTab = ({ errors, rid, onChange }: RoomsTabProps): ReactElement => {
	const t = useTranslation();

	return (
		<Field>
			<Field.Label>{t('Channel_name')}</Field.Label>
			<Field.Row>
				<RoomAutoComplete error={errors.rid} value={rid} onChange={onChange} placeholder={t('Channel_Name_Placeholder')} />
			</Field.Row>
			{errors.rid && <Field.Error>{errors.rid}</Field.Error>}
		</Field>
	);
};

export default RoomsTab;
