import { Accordion, Box, Button, ButtonGroup, Skeleton } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import { useTranslation } from '../../contexts/TranslationContext';
import { Section } from './Section';
import Page from '../../components/basic/Page';

export function GroupPage({ children, headerButtons, save, cancel, _id, i18nLabel, i18nDescription, changed }) {
	const t = useTranslation();

	const handleSubmit = (event) => {
		event.preventDefault();
		save();
	};

	const handleCancelClick = (event) => {
		event.preventDefault();
		cancel();
	};

	const handleSaveClick = (event) => {
		event.preventDefault();
		save();
	};

	if (!_id) {
		return <Page>
			<Page.Header />
			<Page.Content />
		</Page>;
	}

	return <Page is='form' action='#' method='post' onSubmit={handleSubmit}>
		<Page.Header title={t(i18nLabel)}>
			<ButtonGroup>
				{changed && <Button danger primary type='reset' onClick={handleCancelClick}>{t('Cancel')}</Button>}
				<Button
					children={t('Save_changes')}
					className='save'
					disabled={!changed}
					primary
					type='submit'
					onClick={handleSaveClick}
				/>
				{headerButtons}
			</ButtonGroup>
		</Page.Header>

		<Page.ScrollableContentWithShadow>
			<Box style={useMemo(() => ({ margin: '0 auto', width: '100%', maxWidth: '590px' }), [])}>
				{t.has(i18nDescription) && <Box is='p' color='hint' fontScale='p1'>{t(i18nDescription)}</Box>}

				<Accordion className='page-settings'>
					{children}
				</Accordion>
			</Box>
		</Page.ScrollableContentWithShadow>
	</Page>;
}

export function GroupPageSkeleton() {
	const t = useTranslation();

	return <Page>
		<Page.Header title={<Skeleton style={{ width: '20rem' }}/>}>
			<ButtonGroup>
				<Button
					children={t('Save_changes')}
					disabled
					primary
				/>
			</ButtonGroup>
		</Page.Header>

		<Page.Content>
			<Box style={useMemo(() => ({ margin: '0 auto', width: '100%', maxWidth: '590px' }), [])}>
				<Box is='p' color='hint' fontScale='p1'>
					<Skeleton />
					<Skeleton />
					<Skeleton width='75%' />
				</Box>

				<Accordion className='page-settings'>
					<Section.Skeleton />
				</Accordion>
			</Box>
		</Page.Content>
	</Page>;
}

GroupPage.Skeleton = GroupPageSkeleton;
