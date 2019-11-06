import { Button } from '@rocket.chat/fuselage';
import { Meteor } from 'meteor/meteor';
import React from 'react';
import s from 'underscore.string';

import { RawText } from '../../../basic/RawText';
import { useTranslation } from '../../../providers/TranslationProvider';
import { GroupPage } from '../GroupPage';
import { Section } from '../Section';

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
		{group.sections.map((sectionName) => (sectionIsCustomOAuth(sectionName)
			? <Section
				key={sectionName}
				groupId={group._id}
				help={<RawText>{t('Custom_oauth_helper', callbackURL(sectionName))}</RawText>}
				sectionName={sectionName}
				solo={solo}
			>
				<div className='submit'>
					<Button cancel className='remove-custom-oauth'>{t('Remove_custom_oauth')}</Button>
				</div>
			</Section>
			: <Section key={sectionName} groupId={group._id} sectionName={sectionName} solo={solo} />))}
	</GroupPage>;
}
