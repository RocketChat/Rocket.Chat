import { ILivechatCustomField } from '@rocket.chat/core-typings';
import { useTranslation, useRoute } from '@rocket.chat/ui-contexts';
import { Field, TextInput } from '@rocket.chat/fuselage';

import React, { ReactElement } from 'react';

import { useForm } from "react-hook-form";

import VerticalBar from '../../../components/VerticalBar';

type CustomFieldsVerticalBarProps = {
	customFields: ILivechatCustomField[];
	setCustomFields: (customFields: { label: string, value: string }[]) => void;
};


const CustomFieldsVerticalBar = ({ customFields, setCustomFields }: CustomFieldsVerticalBarProps): ReactElement => {
	console.log('CustomFieldsVerticalBar', customFields);

	const { register, handleSubmit, } = useForm({mode: 'onChange'});

	const onSubmit = (data: {[key: string]: string;}) => {
		const payload = Object.keys(data).map((key: string) => ({ label: key, value: data[key]}));
		setCustomFields(payload);
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
				{customFields.map((customField: ILivechatCustomField) => (
				<Field >
					<Field.Label>
						{customField.label}
					</Field.Label>
					<Field.Row>
						<TextInput
							flexGrow={1}
							{...register(customField._id)}
						/>
					</Field.Row>
				</Field>
			))}
			</VerticalBar.ScrollableContent>
		</VerticalBar>
	);
};

export default CustomFieldsVerticalBar;
