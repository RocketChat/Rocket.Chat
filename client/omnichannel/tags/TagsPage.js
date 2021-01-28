import React from 'react';
import { Button, Icon, ButtonGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import Page from '../../components/Page';
import FilterByText from '../../components/FilterByText';
import GenericTable from '../../components/GenericTable';
import { useTranslation } from '../../contexts/TranslationContext';
import { useRoute } from '../../contexts/RouterContext';

function TagsPage({
	data,
	header,
	setParams,
	params,
	title,
	renderRow,
	children,
}) {
	const t = useTranslation();

	const tagsRoute = useRoute('omnichannel-tags');

	const handleClick = useMutableCallback(() => tagsRoute.push({
		context: 'new',
	}));

	return <Page flexDirection='row'>
		<Page>
			<Page.Header title={title}>
				<ButtonGroup>
					<Button onClick={handleClick} title={t('New_Tag')}>
						<Icon name='plus'/> {t('New')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.Content>
				<GenericTable
					header={header}
					renderRow={renderRow}
					results={data && data.tags}
					total={data && data.total}
					setParams={setParams}
					params={params}
					renderFilter={({ onChange, ...props }) => <FilterByText onChange={onChange} {...props} />}
				/>
			</Page.Content>
		</Page>
		{children}
	</Page>;
}

export default TagsPage;
