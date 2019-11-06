import { Button } from '@rocket.chat/fuselage';
import { Meteor } from 'meteor/meteor';
import React from 'react';
import s from 'underscore.string';

import { RawText } from '../../../basic/RawText';
import { useTranslation } from '../../../providers/TranslationProvider';
import { GroupPage } from '../GroupPage';
import { Section } from '../Section';
import { SectionState } from '../SectionState';

export function OAuthGroupPage({ group }) {
	const solo = group.sections.length === 1;
	const t = useTranslation();

	const sectionIsCustomOAuth = (sectionName) => sectionName && /^Custom OAuth:\s.+/.test(sectionName);

	const callbackURL = (sectionName) => {
		const id = s.strRight(sectionName, 'Custom OAuth: ').toLowerCase();
		return Meteor.absoluteUrl(`_oauth/${ id }`);
	};

	return <GroupPage group={group} headerButtons={<>
		<Button className='refresh-oauth'>{t('Refresh_oauth_services')}</Button>
		<Button className='add-custom-oauth'>{t('Add_custom_oauth')}</Button>
	</>}>
		{group.sections.map((section) => <SectionState key={section} group={group} section={section}>
			{(sectionIsCustomOAuth(section)
				? <Section
					help={<RawText>{t('Custom_oauth_helper', callbackURL(section))}</RawText>}
					solo={solo}
				>
					<div className='submit'>
						<Button cancel className='remove-custom-oauth'>{t('Remove_custom_oauth')}</Button>
					</div>
				</Section>
				: <Section solo={solo} />)}
		</SectionState>)}
	</GroupPage>;
}
