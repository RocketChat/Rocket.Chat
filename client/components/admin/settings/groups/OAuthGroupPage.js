import { Button } from '@rocket.chat/fuselage';
import { Meteor } from 'meteor/meteor';
import React from 'react';
import toastr from 'toastr';
import s from 'underscore.string';

import { call } from '../../../../../app/ui-utils/client/lib/callMethod';
import { modal } from '../../../../../app/ui-utils/client/lib/modal';
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

	const handleRefreshOAuthServicesButtonClick = () => {
		toastr.info(t('Refreshing'));
		call('refreshOAuthService').then(() => {
			toastr.success(t('Done'));
		});
	};

	const handleAddCustomOAuthButtonClick = () => {
		modal.open({
			title: t('Add_custom_oauth'),
			text: t('Give_a_unique_name_for_the_custom_oauth'),
			type: 'input',
			showCancelButton: true,
			closeOnConfirm: true,
			inputPlaceholder: t('Custom_oauth_unique_name'),
		}, (inputValue) => {
			if (inputValue === false) {
				return false;
			}
			if (inputValue === '') {
				modal.showInputError(t('Name_cant_be_empty'));
				return false;
			}
			call('addOAuthService', inputValue);
		});
	};

	return <GroupPage group={group} headerButtons={<>
		<Button onClick={handleRefreshOAuthServicesButtonClick}>{t('Refresh_oauth_services')}</Button>
		<Button onClick={handleAddCustomOAuthButtonClick}>{t('Add_custom_oauth')}</Button>
	</>}>
		{group.sections.map((sectionName) => {
			if (sectionIsCustomOAuth(sectionName)) {
				const id = s.strRight(sectionName, 'Custom OAuth: ').toLowerCase();

				const handleRemoveCustomOAuthButtonClick = () => {
					modal.open({
						title: t('Are_you_sure'),
						type: 'warning',
						showCancelButton: true,
						confirmButtonColor: '#DD6B55',
						confirmButtonText: t('Yes_delete_it'),
						cancelButtonText: t('Cancel'),
						closeOnConfirm: true,
					}, () => {
						call('removeOAuthService', id);
					});
				};

				return <Section
					key={sectionName}
					groupId={group._id}
					help={<RawText>{t('Custom_oauth_helper', callbackURL(sectionName))}</RawText>}
					sectionName={sectionName}
					solo={solo}
				>
					<div className='submit'>
						<Button danger onClick={handleRemoveCustomOAuthButtonClick}>{t('Remove_custom_oauth')}</Button>
					</div>
				</Section>;
			}

			return <Section key={sectionName} groupId={group._id} sectionName={sectionName} solo={solo} />;
		})}
	</GroupPage>;
}
