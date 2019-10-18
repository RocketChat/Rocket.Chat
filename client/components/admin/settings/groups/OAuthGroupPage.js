import { Meteor } from 'meteor/meteor';
import React from 'react';
import s from 'underscore.string';

import { Button } from '../../../basic/Button';
import { RawText } from '../../../basic/RawText';
import { useTranslation } from '../../../providers/TranslationProvider';
import { useGroup } from '../EditingState';
import { GroupPage } from '../GroupPage';
import { Section } from '../Section';

export function OAuthGroupPage() {
	const group = useGroup();
	const t = useTranslation();

	const sectionIsCustomOAuth = (sectionName) => sectionName && /^Custom OAuth:\s.+/.test(sectionName);

	const callbackURL = (sectionName) => {
		const id = s.strRight(sectionName, 'Custom OAuth: ').toLowerCase();
		return Meteor.absoluteUrl(`_oauth/${ id }`);
	};

	return <GroupPage headerButtons={<>
		<Button secondary className='refresh-oauth'>{t('Refresh_oauth_services')}</Button>
		<Button secondary className='add-custom-oauth'>{t('Add_custom_oauth')}</Button>
	</>}>
		{group.sections.map((section) => (sectionIsCustomOAuth(section.name)
			? <Section key={section.name} section={section} help={<RawText>{t('Custom_oauth_helper', callbackURL(section.name))}</RawText>}>
				<div className='submit'>
					<Button cancel className='remove-custom-oauth'>{t('Remove_custom_oauth')}</Button>
				</div>
			</Section>
			: <Section key={section.name} section={section} />))}
	</GroupPage>;
}
