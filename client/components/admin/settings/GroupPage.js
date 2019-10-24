import { Accordion, Button, Paragraph } from '@rocket.chat/fuselage';
import React from 'react';

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

	const handleSubmit = (event) => {
		event.preventDefault();
		save(group);
	};

	const handleCancelClick = (event) => {
		event.preventDefault();
		cancel(group);
	};

	const handleSaveClick = (event) => {
		event.preventDefault();
		save(group);
	};

	return <form action='#' className='page-container' method='post' onSubmit={handleSubmit}>
		<Header rawSectionName={t(group.i18nLabel)}>
			<Header.ButtonSection>
				{group.changed && <Button danger primary type='reset' onClick={handleCancelClick}>{t('Cancel')}</Button>}
				<Button
					className='save'
					disabled={!group.changed}
					primary
					type='submit'
					onClick={handleSaveClick}
				>{t('Save_changes')}</Button>
				{headerButtons}
			</Header.ButtonSection>
		</Header>

		<div className='content'>
			{t.has(group.i18nDescription) && <Paragraph hintColor>{t(group.i18nDescription)}</Paragraph>}

			<Accordion className='page-settings'>
				{children}
			</Accordion>
		</div>
	</form>;
}
