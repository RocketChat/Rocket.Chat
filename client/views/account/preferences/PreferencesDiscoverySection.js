import { Accordion, Field, FieldGroup, MultiSelect } from '@rocket.chat/fuselage';
import React from 'react';

import { useSetting } from '../../../contexts/SettingsContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useUserPreference } from '../../../contexts/UserContext';
import { useForm } from '../../../hooks/useForm';

const PreferencesDiscoverySection = ({ onChange, commitRef, ...props }) => {
	const t = useTranslation();

	const userTags = useUserPreference('tags') ?? [];

	const discoveryTags = useSetting('Discovery_Tags');
	const tagsAvailable = discoveryTags
		? discoveryTags.split(',').map((item) => [item.trim(), `#${item.trim()}`])
		: [];

	const { values, handlers, commit } = useForm({ tags: userTags }, onChange);

	const { tags } = values;
	const displayTags = tags.filter((tag) => tagsAvailable.includes(tag));

	const { handleTags } = handlers;

	commitRef.current.tags = commit;

	return (
		<Accordion.Item title={t('Discovery')} {...props}>
			<FieldGroup>
				<Field>
					<Field.Label>{t('Discovery_Tags')}</Field.Label>
					<Field.Row>
						<MultiSelect
							options={tagsAvailable}
							value={displayTags}
							maxWidth='100%'
							placeholder={t('Select_an_option')}
							onChange={handleTags}
						/>
					</Field.Row>
					<Field.Hint>{t('Discovery_Tags_How_To')}</Field.Hint>
				</Field>
			</FieldGroup>
		</Accordion.Item>
	);
};

export default PreferencesDiscoverySection;
