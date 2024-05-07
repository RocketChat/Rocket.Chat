import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useRouter, useTranslation, useRouteParameter } from '@rocket.chat/ui-contexts';
import React from 'react';

import { ContextualbarDialog } from '../../../../client/components/Contextualbar';
import { Page, PageHeader, PageContent } from '../../../../client/components/Page';
import TagEdit from './TagEdit';
import TagEditWithData from './TagEditWithData';
import TagsTable from './TagsTable';

const TagsPage = () => {
	const t = useTranslation();
	const router = useRouter();
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	return (
		<Page flexDirection='row'>
			<Page>
				<PageHeader title={t('Tags')}>
					<ButtonGroup>
						<Button onClick={() => router.navigate('/omnichannel/tags/new')}>{t('Create_tag')}</Button>
					</ButtonGroup>
				</PageHeader>
				<PageContent>
					<TagsTable />
				</PageContent>
			</Page>
			{context && (
				<ContextualbarDialog>
					{context === 'edit' && id && <TagEditWithData tagId={id} />}
					{context === 'new' && <TagEdit />}
				</ContextualbarDialog>
			)}
		</Page>
	);
};

export default TagsPage;
