import React, { FC, FormEvent } from 'react';
import { Box, Field, TextInput, ToggleSwitch, BoxClassName } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';

type FiltersFormProps = {
	values: {
		name: string;
		description: string;
		enabled: boolean;
		regex: string;
		slug: string;
	};
	handlers: {
		handleName: (event: FormEvent<HTMLInputElement>) => void;
		handleDescription: (event: FormEvent<HTMLInputElement>) => void;
		handleEnabled: (event: FormEvent<HTMLInputElement>) => void;
		handleRegex: (event: FormEvent<HTMLInputElement>) => void;
		handleSlug: (event: FormEvent<HTMLInputElement>) => void;
	};
	className?: BoxClassName;
}

const FiltersForm: FC<FiltersFormProps> = ({ values, handlers, className }) => {
	const t = useTranslation();
	const {
		name,
		description,
		enabled,
		regex,
		slug,
	} = values;

	const {
		handleName,
		handleDescription,
		handleEnabled,
		handleRegex,
		handleSlug,
	} = handlers;

	return <>
		<Field className={className}>
			<Box display='flex' flexDirection='row'>
				<Field.Label>{t('Enabled')}</Field.Label>
				<Field.Row>
					<ToggleSwitch checked={enabled} onChange={handleEnabled}/>
				</Field.Row>
			</Box>
		</Field>
		<Field className={className}>
			<Field.Label>{t('Name')}</Field.Label>
			<Field.Row>
				<TextInput value={name} onChange={handleName} placeholder={t('Name')}/>
			</Field.Row>
		</Field>
		<Field className={className}>
			<Field.Label>{t('Description')}</Field.Label>
			<Field.Row>
				<TextInput value={description} onChange={handleDescription} placeholder={t('Description')}/>
			</Field.Row>
		</Field>
		<Field className={className}>
			<Field.Label>{t('Regex')}</Field.Label>
			<Field.Row>
				<TextInput value={regex} onChange={handleRegex} placeholder={t('Enter_a_regex')}/>
			</Field.Row>
		</Field>
		<Field className={className}>
			<Field.Label>{t('Slug')}</Field.Label>
			<Field.Row>
				<TextInput value={slug} onChange={handleSlug} placeholder={t('Enter_a_slug_value')}/>
			</Field.Row>
		</Field>
	</>;
};

export default FiltersForm;
