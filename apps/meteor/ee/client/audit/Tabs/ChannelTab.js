import { Field } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import RoomAutoComplete from '../RoomAutoComplete';

const ChannelTab = ({ errors, rid, handleRid }) => {
	const t = useTranslation();

	return (
		<Field>
			<Field.Label>{t('Channel_name')}</Field.Label>
			<Field.Row>
				<RoomAutoComplete error={errors.rid} value={rid} onChange={handleRid} placeholder={t('Channel_Name_Placeholder')} />
			</Field.Row>
			{errors.rid && <Field.Error>{errors.rid}</Field.Error>}
		</Field>
	);
};

export default ChannelTab;
