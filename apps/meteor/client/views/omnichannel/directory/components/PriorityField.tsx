import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { FormSkeleton } from './FormSkeleton';
import Field from '../../components/Field';
import Info from '../../components/Info';
import Label from '../../components/Label';
import { usePriorityInfo } from '../hooks/usePriorityInfo';

type PriorityFieldProps = {
	id: string;
};

const PriorityField = ({ id }: PriorityFieldProps) => {
	const { t } = useTranslation();
	const { data, isLoading, isError } = usePriorityInfo(id);

	if (isLoading) {
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
