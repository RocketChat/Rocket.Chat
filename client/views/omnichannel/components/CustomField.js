import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import { useOmnichannelCustomFields } from '../../../contexts/OmnichannelContext/OmnichannelCustomFieldsContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import Field from './Field';
import Info from './Info';
import Label from './Label';

const CustomField = ({ id, value }) => {
	const t = useTranslation();
	const customField = useOmnichannelCustomFields().find((customField) => customField._id === id);

	if (!customField) {
		return <Box mbs='x16'>{t('Custom_Field_Not_Found')}</Box>;
	}
	const { label } = customField;
	return (
		label && (
			<Field>
				<Label>{label}</Label>
				<Info>{value}</Info>
			</Field>
		)
	);
};

export default CustomField;
