import { Field, TextInput } from '@rocket.chat/fuselage';
import { useTranslation, useRoute } from '@rocket.chat/ui-contexts';
import React, { ReactElement, Dispatch, SetStateAction, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import VerticalBar from '../../../components/VerticalBar';

type CustomFieldsVerticalBarProps = {
	customFields: { [key: string]: string };
	setCustomFields: Dispatch<SetStateAction<{ [key: string]: string }>>;
	allCustomFields: unknown;
};

const CustomFieldsVerticalBar = ({ setCustomFields, allCustomFields }: CustomFieldsVerticalBarProps): ReactElement => {
	console.log(allCustomFields);

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
				{/* TODO: REMOVE FILTER ONCE THE ENDPOINT SUPPORTS A SCOPE PARAMETER */}
				{allCustomFields?.customFields
					.filter((customField) => customField.scope !== 'visitor')
					.map((customField) => customfield(
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
