import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useRouter, useTranslation, useRouteParameter } from '@rocket.chat/ui-contexts';

import TagEdit from './TagEdit';
import TagEditWithData from './TagEditWithData';
import TagsTable from './TagsTable';
import { ContextualbarDialog } from '../../components/Contextualbar';
import { Page, PageHeader, PageContent } from '../../components/Page';

const TagsPage = () => {
	const t = useTranslation();
	const router = useRouter();
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const handleCloseContextualbar = useEffectEvent(() => router.navigate('/omnichannel/tags'));

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
				<ContextualbarDialog onClose={handleCloseContextualbar}>
					{context === 'edit' && id && <TagEditWithData tagId={id} onClose={handleCloseContextualbar} />}
					{context === 'new' && <TagEdit onClose={handleCloseContextualbar} />}
				</ContextualbarDialog>
			)}
		</Page>
	);
};

export default TagsPage;
