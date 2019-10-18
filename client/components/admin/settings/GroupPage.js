import React from 'react';

import { Button } from '../../basic/Button';
import { Header } from '../../header/Header';
import { useTranslation } from '../../providers/TranslationProvider';
import { useGroup, useBulkActions } from './EditingState';

export function GroupPage({ children, headerButtons }) {
	const t = useTranslation();
	const group = useGroup();
	const { save, cancel } = useBulkActions();

	if (!group) {
		return <section className='page-container page-static page-settings'>
			<Header />
			<div className='content' />
		</section>;
	}

	const handleCancelClick = () => {
		cancel(group);
	};

	const handleSaveClick = () => {
		save(group);
	};

	return <section className='page-container page-static page-settings'>
		<Header rawSectionName={t(group.i18nLabel)}>
			<Header.ButtonSection>
				{group.changed && <Button cancel onClick={handleCancelClick}>{t('Cancel')}</Button>}
				<Button primary disabled={!group.changed} onClick={handleSaveClick}>{t('Save_changes')}</Button>
				{headerButtons}
			</Header.ButtonSection>
		</Header>

		<div className='content'>
			{t.has(group.i18nDescription) && <div className='info'>
				<p className='settings-description'>{t(group.i18nDescription)}</p>
			</div>}

			<div className='page-settings rocket-form'>
				{children}
			</div>
		</div>
	</section>;
}
