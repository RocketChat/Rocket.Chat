// TODO
// DONE Add Router Usage
// Create REF for the "save" state
// DONE Move the logic from FilterByText to this component
// DONE Convert CustomFieldAssembler to ts and expose it
// Review the logic of this file
// Create a hook for the convertCustomFieldsToValidJSONFormat and rename it to something more appropriate
// Implement interfaces for different custom Fields

import React, { FC } from 'react';

import { ILivechatCustomField } from '../../../../definition/ILivechatCustomField';
import OmnichannelCustomFieldsForm from '../../../components/Omnichannel/OmnichannelCustomFieldsForm';
import VerticalBar from '../../../components/VerticalBar';
import { useRoute } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';

type CustomFieldsVerticalBarProps = {
	customFields: ILivechatCustomField[];
	register: unknown;
	errors: unknown[];
};

const CustomFieldsVerticalBar: FC<CustomFieldsVerticalBarProps> = ({ customFields, register, errors }) => {
	console.log('CustomFieldsVerticalBar', customFields);

	const t = useTranslation();
	const currentChatsRoute = useRoute('omnichannel-current-chats');

	return (
		<VerticalBar>
			<VerticalBar.Header>
				{t('Filter_by_Custom_Fields')}
				<VerticalBar.Close onClick={(): void => currentChatsRoute.push({ context: '' })} />
			</VerticalBar.Header>
			<VerticalBar.ScrollableContent>
				<OmnichannelCustomFieldsForm customFields={customFields} register={register} errors={errors} />
			</VerticalBar.ScrollableContent>
		</VerticalBar>
	);
};

export default CustomFieldsVerticalBar;
