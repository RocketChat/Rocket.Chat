import { Field, TextInput } from '@rocket.chat/fuselage';
import { useTranslation, useRoute } from '@rocket.chat/ui-contexts';
import React, { ReactElement, Dispatch, SetStateAction } from 'react';
import { useForm } from 'react-hook-form';

import VerticalBar from '../../../components/VerticalBar';
import { useEndpointData } from '../../../hooks/useEndpointData';

type CustomFieldsVerticalBarProps = {
	customFields: { [key: string]: string };
	setCustomFields: Dispatch<SetStateAction<{ [key: string]: string }>>;
};

const CustomFieldsVerticalBar = ({ customFields, setCustomFields }: CustomFieldsVerticalBarProps): ReactElement => {
	console.log('CustomFieldsVerticalBar', customFields);
	const { value: allCustomFields } = useEndpointData('/v1/livechat/custom-fields');

	const { register, handleSubmit } = useForm({ mode: 'onChange' });

	// TODO: When we refactor the other CurrentChat's fields to use react-hook-form, we need to change this to use the form controller
	const onSubmit = (data: { [key: string]: string }): void => {
		setCustomFields(data);
	};

	const t = useTranslation();
	const currentChatsRoute = useRoute('omnichannel-current-chats');

	return (
		<VerticalBar>
			<VerticalBar.Header>
				{t('Filter_by_Custom_Fields')}
				<VerticalBar.Close onClick={(): void => currentChatsRoute.push({ context: '' })} />
			</VerticalBar.Header>
			<VerticalBar.ScrollableContent is='form' onSubmit={handleSubmit(onSubmit)}>
				{allCustomFields?.customFields.map((customField: { _id: string; label: string }) => (
					<Field>
						<Field.Label>{customField.label}</Field.Label>
						<Field.Row>
							<TextInput flexGrow={1} {...register(customField._id)} />
						</Field.Row>
					</Field>
				))}
			</VerticalBar.ScrollableContent>
		</VerticalBar>
	);
};

export default CustomFieldsVerticalBar;
