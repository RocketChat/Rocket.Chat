import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import type { MutableRefObject } from 'react';
import React from 'react';

import Page from '../../../../client/components/Page';
import TagsTable from './TagsTable';

const TagsPage = ({ reload }: { reload: MutableRefObject<() => void> }) => {
	const t = useTranslation();
	const tagsRoute = useRoute('omnichannel-tags');

	const handleClick = useMutableCallback(() =>
		tagsRoute.push({
			context: 'new',
		}),
	);

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={t('Tags')}>
					<ButtonGroup>
						<Button onClick={handleClick}>{t('Create_tag')}</Button>
					</ButtonGroup>
				</Page.Header>
				<Page.Content>
					<TagsTable reload={reload} />
				</Page.Content>
			</Page>
		</Page>
	);
};

export default TagsPage;
