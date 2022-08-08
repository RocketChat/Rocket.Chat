import { Field, TextInput } from '@rocket.chat/fuselage';
import { useTranslation, useRoute } from '@rocket.chat/ui-contexts';
import React, { ReactElement, Dispatch, SetStateAction, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import VerticalBar from '../../../components/VerticalBar';
import { useEndpointData } from '../../../hooks/useEndpointData';

type CustomFieldsVerticalBarProps = {
	customFields: { [key: string]: string };
	setCustomFields: Dispatch<SetStateAction<{ [key: string]: string }>>;
};

const CustomFieldsVerticalBar = ({ setCustomFields }: CustomFieldsVerticalBarProps): ReactElement => {
	const { value: allCustomFields } = useEndpointData('/v1/livechat/custom-fields');

	const { register, watch } = useForm({ mode: 'onChange' });

	// TODO: When we refactor the other CurrentChat's fields to use react-hook-form, we need to change this to use the form controller

	useEffect(() => {
		const subscription = watch((value) => setCustomFields(value));
		return (): void => subscription.unsubscribe();
	}, [setCustomFields, watch]);

	const t = useTranslation();
	const currentChatsRoute = useRoute('omnichannel-current-chats');

	return (
		<VerticalBar>
			<VerticalBar.Header>
				{t('Filter_by_Custom_Fields')}
				<VerticalBar.Close onClick={(): void => currentChatsRoute.push({ context: '' })} />
			</VerticalBar.Header>
			<VerticalBar.ScrollableContent is='form'>
				{allCustomFields?.customFields.map((customField) => (
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
