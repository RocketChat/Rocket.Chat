import React from 'react';

import { useTranslation } from '../../../../../contexts/TranslationContext';
import { AsyncStatePhase } from '../../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
import { FormSkeleton } from '../../Skeleton';
import Info from './Info';
import Label from './Label';

const DepartmentField = ({ departmentId }) => {
	const t = useTranslation();
	const { value: data, phase: state } = useEndpointData(`livechat/department/${departmentId}`);
	if (state === AsyncStatePhase.LOADING) {
		return <FormSkeleton />;
	}
	const {
		department: { name },
	} = data || { department: {} };
	return (
		<>
			<Label>{t('Department')}</Label>
			<Info>{name}</Info>
		</>
	);
};

export default DepartmentField;
