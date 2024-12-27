import { Box } from '@rocket.chat/fuselage';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { InfoPanelField, InfoPanelLabel, InfoPanelText } from '../../../components/InfoPanel';
import { FormSkeleton } from '../directory/components/FormSkeleton';

type CustomFieldProps = {
	id: string;
	value: string;
};

const CustomField = ({ id, value }: CustomFieldProps) => {
	const { t } = useTranslation();
	const getCustomField = useEndpoint('GET', '/v1/livechat/custom-fields/:_id', { _id: id });
	const { data, isPending, isError } = useQuery({
		queryKey: ['/v1/livechat/custom-field', id],
		queryFn: () => getCustomField(),
	});

	if (isPending) {
		return <FormSkeleton />;
	}

	if (isError || !data?.customField) {
		return <Box mbs={16}>{t('Custom_Field_Not_Found')}</Box>;
	}

	const { label } = data.customField;

	if (!label) {
		return null;
	}

	return (
		<InfoPanelField>
			<InfoPanelLabel>{label}</InfoPanelLabel>
			<InfoPanelText>{value}</InfoPanelText>
		</InfoPanelField>
	);
};

export default CustomField;
