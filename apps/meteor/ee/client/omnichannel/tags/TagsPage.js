import { Button, Icon, ButtonGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import FilterByText from '../../../../client/components/FilterByText';
import GenericTable from '../../../../client/components/GenericTable';
import Page from '../../../../client/components/Page';

function TagsPage({ data, header, setParams, params, title, renderRow, children }) {
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
				<Page.Header title={title}>
					<ButtonGroup>
						<Button onClick={handleClick} title={t('New_Tag')}>
							<Icon name='plus' /> {t('New')}
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
		</Page>
	);
}

export default TagsPage;
