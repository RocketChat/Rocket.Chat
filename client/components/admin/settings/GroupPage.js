import { Accordion, Button, Paragraph, Text } from '@rocket.chat/fuselage';
import React from 'react';
import styled from 'styled-components';

import { Header } from '../../header/Header';
import { useTranslation } from '../../providers/TranslationProvider';
import { Section } from './Section';

const Wrapper = styled.div`
	margin: 0 auto;
	width: 100%;
	max-width: 590px;
`;

export function GroupPage({ children, group, headerButtons }) {
	const t = useTranslation();

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
					children={t('Save_changes')}
					className='save'
					disabled={!group.changed}
					primary
					type='submit'
					onClick={handleSaveClick}
				/>
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

GroupPage.Skeleton = function Skeleton() {
	const t = useTranslation();

	return <div className='page-container'>
		<Header rawSectionName={<div style={{ width: '20rem' }}><Text.Skeleton animated headline /></div>}>
			<Header.ButtonSection>
				<Button
					children={t('Save_changes')}
					disabled
					primary
				/>
			</Header.ButtonSection>
		</Header>

		<div className='content'>
			<Wrapper>
				<Paragraph.Skeleton animated />

				<Accordion className='page-settings'>
					<Section.Skeleton />
				</Accordion>
			</Wrapper>
		</div>
	</div>;
};
