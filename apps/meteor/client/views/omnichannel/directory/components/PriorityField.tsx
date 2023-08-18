import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import Field from '../../components/Field';
import Info from '../../components/Info';
import Label from '../../components/Label';
import { usePriorityInfo } from '../hooks/usePriorityInfo';
import { FormSkeleton } from './FormSkeleton';

type PriorityFieldProps = {
	id: string;
};

const PriorityField = ({ id }: PriorityFieldProps) => {
	const t = useTranslation();
	const { data, isInitialLoading, isError } = usePriorityInfo(id);

	if (isInitialLoading) {
		return <FormSkeleton />;
	}

	if (isError || !data) {
		return <Box mbs={16}>{t('Custom_Field_Not_Found')}</Box>;
	}

	const { dirty, name, i18n } = data;
	return (
		<Field>
			<Label>{t('Priority')}</Label>
			<Info>{dirty ? name : t(i18n)}</Info>
		</Field>
	);
};

export default PriorityField;
