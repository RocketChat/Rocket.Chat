import type { ILivechatCustomField } from '@rocket.chat/core-typings';
import { Field, FieldLabel, FieldRow, TextInput, Select } from '@rocket.chat/fuselage';
import { useTranslation, useRoute } from '@rocket.chat/ui-contexts';
import type { ReactElement, Dispatch, SetStateAction } from 'react';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

import {
	Contextualbar,
	ContextualbarScrollableContent,
	ContextualbarHeader,
	ContextualbarClose,
	ContextualbarDialog,
	ContextualbarTitle,
} from '../../../components/Contextualbar';

type CustomFieldsListProps = {
	setCustomFields: Dispatch<SetStateAction<{ [key: string]: string } | undefined>>;
	allCustomFields: ILivechatCustomField[];
};

const CustomFieldsList = ({ setCustomFields, allCustomFields }: CustomFieldsListProps): ReactElement => {
	const { register, watch, control } = useForm({ mode: 'onChange' });

	// TODO: When we refactor the other CurrentChat's fields to use react-hook-form, we need to change this to use the form controller

	useEffect(() => {
		const subscription = watch((value) => setCustomFields(value));
		return (): void => subscription.unsubscribe();
	}, [setCustomFields, watch]);

	const t = useTranslation();
	const currentChatsRoute = useRoute('omnichannel-current-chats');

	return (
		<ContextualbarDialog>
			<Contextualbar>
				<ContextualbarHeader>
					<ContextualbarTitle>{t('Filter_by_Custom_Fields')}</ContextualbarTitle>
					<ContextualbarClose onClick={(): void => currentChatsRoute.push({ context: '' })} />
				</ContextualbarHeader>
				<ContextualbarScrollableContent is='form'>
					{/* TODO: REMOVE FILTER ONCE THE ENDPOINT SUPPORTS A SCOPE PARAMETER */}
					{allCustomFields
						.filter((customField) => customField.scope !== 'visitor')
						.map((customField: ILivechatCustomField) => {
							if (customField.type === 'select') {
								return (
									<Field key={customField._id}>
										<FieldLabel>{customField.label}</FieldLabel>
										<FieldRow>
											<Controller
												name={customField._id}
												control={control}
												render={({ field }): ReactElement => (
													<Select {...field} options={(customField.options || '').split(',').map((item) => [item, item])} />
												)}
											/>
										</FieldRow>
									</Field>
								);
							}

							return (
								<Field key={customField._id}>
									<FieldLabel>{customField.label}</FieldLabel>
									<FieldRow>
										<TextInput flexGrow={1} {...register(customField._id)} />
									</FieldRow>
								</Field>
							);
						})}
				</ContextualbarScrollableContent>
			</Contextualbar>
		</ContextualbarDialog>
	);
};

export default CustomFieldsList;
