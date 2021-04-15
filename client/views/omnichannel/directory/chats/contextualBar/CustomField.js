import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../../../../contexts/TranslationContext';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../../../lib/asyncState';
import { FormSkeleton } from '../../Skeleton';
import Info from './Info';
import Label from './Label';

const CustomField = ({ id, value }) => {
	const t = useTranslation();
	const { value: data, phase: state, error } = useEndpointData(`livechat/custom-fields/${id}`);
	if (state === AsyncStatePhase.LOADING) {
		return <FormSkeleton />;
	}
	if (error || !data || !data.customField) {
		return <Box mbs='x16'>{t('Custom_Field_Not_Found')}</Box>;
	}
	const { label } = data.customField;
	return (
		label && (
			<>
				<Label>{label}</Label>
				<Info>{value}</Info>
			</>
		)
	);
};

export default CustomField;
