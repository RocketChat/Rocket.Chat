import { Box, Flex } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import Page from '../../../../client/components/Page';
import { AgentsSection, ChannelsSection, DepartmentsSection, StatusSection, TagsSection } from './sections';

const ReportsPage = () => {
	const t = useTranslation();

	return (
		<Page background='tint'>
			<Page.Header title={t('Reports')}></Page.Header>
			<Page.ScrollableContentWithShadow>
				<Box display='flex' flexWrap='wrap'>
					<Flex.Item grow={1} shrink={0} basis='50%'>
						<StatusSection />
					</Flex.Item>

					<Flex.Item grow={1} shrink={0} basis='50%'>
						<ChannelsSection />
					</Flex.Item>

					<Flex.Item grow={1} shrink={0} basis='50%'>
						<DepartmentsSection />
					</Flex.Item>

					<Flex.Item grow={1} shrink={0} basis='50%'>
						<TagsSection />
					</Flex.Item>

					<Flex.Item grow={1} shrink={0}>
						<AgentsSection />
					</Flex.Item>
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default ReportsPage;
