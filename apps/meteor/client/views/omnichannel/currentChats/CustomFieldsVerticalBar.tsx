import type { ILivechatCustomField } from '@rocket.chat/core-typings';
import { Field, TextInput, Select } from '@rocket.chat/fuselage';
import { useTranslation, useRoute } from '@rocket.chat/ui-contexts';
import type { ReactElement, Dispatch, SetStateAction } from 'react';
import React, { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

import VerticalBar from '../../../components/VerticalBar';

type CustomFieldsVerticalBarProps = {
	setCustomFields: Dispatch<SetStateAction<{ [key: string]: string } | undefined>>;
	allCustomFields: ILivechatCustomField[];
};

const CustomFieldsVerticalBar = ({ setCustomFields, allCustomFields }: CustomFieldsVerticalBarProps): ReactElement => {
	const { register, watch, control } = useForm({ mode: 'onChange' });

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
				{allCustomFields
					.filter((customField) => customField.scope !== 'visitor')
					.map((customField: ILivechatCustomField) =>
						customField.type === 'select' ? (
							<Field>
								<Field.Label>{customField.label}</Field.Label>
								<Field.Row>
									<Controller
										name={customField._id}
										control={control}
										render={({ field }): ReactElement => (
											<Select {...field} options={(customField.options || '').split(',').map((item) => [item, item])} />
										)}
									/>
								</Field.Row>
							</Field>
						) : (
							<Field>
								<Field.Label>{customField.label}</Field.Label>
								<Field.Row>
									<TextInput flexGrow={1} {...register(customField._id)} />
								</Field.Row>
							</Field>
						),
					)}
			</VerticalBar.ScrollableContent>
		</VerticalBar>
	);
};

export default CustomFieldsVerticalBar;
