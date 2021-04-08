import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../../../../contexts/TranslationContext';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../../../lib/asyncState';
import { FormSkeleton } from '../../Skeleton';
import Info from './Info';
import Label from './Label';

const PriorityField = ({ id }) => {
	const t = useTranslation();
	const { value: data, phase: state, error } = useEndpointData(
		`livechat/priorities.getOne?priorityId=${id}`,
	);
	if (state === AsyncStatePhase.LOADING) {
		return <FormSkeleton />;
	}
	if (error || !data) {
		return <Box mbs='x16'>{t('Custom_Field_Not_Found')}</Box>;
	}
	const { name } = data;
	return (
		<>
			<Label>{t('Priority')}</Label>
			<Info>{name}</Info>
		</>
	);
};

export default PriorityField;
