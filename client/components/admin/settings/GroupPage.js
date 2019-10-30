import { Accordion, Button, Paragraph } from '@rocket.chat/fuselage';
import React from 'react';
import styled from 'styled-components';

import { Header } from '../../header/Header';
import { useTranslation } from '../../providers/TranslationProvider';
import { useGroup } from './GroupState';

const Wrapper = styled.div`
	margin: 0 auto;
	width: 100%;
	max-width: 590px;
`;

export function GroupPage({ children, headerButtons }) {
	const t = useTranslation();
	const group = useGroup();

	const handleSubmit = (event) => {
		event.preventDefault();
		group.save();
	};

	const handleCancelClick = (event) => {
		event.preventDefault();
		group.cancel();
	};

	const handleSaveClick = (event) => {
		event.preventDefault();
		group.save();
	};

	if (!group) {
		return <section className='page-container page-static page-settings'>
			<Header />
			<div className='content' />
		</section>;
	}

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
			<Wrapper>
				{t.has(group.i18nDescription) && <Paragraph hintColor>{t(group.i18nDescription)}</Paragraph>}

				<Accordion className='page-settings'>
					{children}
				</Accordion>
			</Wrapper>
		</div>
	</form>;
}
