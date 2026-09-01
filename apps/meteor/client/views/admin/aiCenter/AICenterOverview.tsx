import { AI_LICENSE_MODULE } from '@rocket.chat/ai-search';
import { Box, Button, Callout, CardGrid, Tag } from '@rocket.chat/fuselage';
import { Page, PageHeader, PageScrollableContentWithShadow } from '@rocket.chat/ui-client';
import { useRouter, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import AICenterCapabilityCard from './AICenterCapabilityCard';
import PageSkeleton from '../../../components/PageSkeleton';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';

const AICenterOverview = (): ReactElement => {
	const { t } = useTranslation();
	const router = useRouter();
	const { data: hasAILicense, isPending } = useHasLicenseModule(AI_LICENSE_MODULE);
	const intelligentSearchEnabled = useSetting('AI_Intelligent_Search_Enabled', false);
	const mcpEnabled = useSetting('MCP_Enabled', false);
	const searchSettingsHref = router.buildRoutePath({ name: 'admin-ai-center', params: { section: 'search' } });
	const llmSettingsHref = router.buildRoutePath({ name: 'admin-ai-center', params: { section: 'llm-providers' } });
	const mcpSettingsHref = router.buildRoutePath({ name: 'admin-ai-center', params: { section: 'mcp' } });
	const subscriptionHref = router.buildRoutePath({ name: 'subscription' });

	if (isPending) {
		return <PageSkeleton />;
	}

	let aiSearchStatus: ReactNode;
	let llmProviderStatus: ReactNode;
	let mcpStatus: ReactNode;
	if (hasAILicense === false) {
		aiSearchStatus = <Tag variant='danger'>{t('Locked')}</Tag>;
		llmProviderStatus = <Tag variant='danger'>{t('Locked')}</Tag>;
		mcpStatus = <Tag variant='danger'>{t('Locked')}</Tag>;
	} else if (hasAILicense) {
		aiSearchStatus = intelligentSearchEnabled ? <Tag variant='primary'>{t('Enabled')}</Tag> : <Tag>{t('Disabled')}</Tag>;
		llmProviderStatus = <Tag>{t('Available')}</Tag>;
		mcpStatus = mcpEnabled ? <Tag variant='primary'>{t('Enabled')}</Tag> : <Tag>{t('Disabled')}</Tag>;
	}

	return (
		<Page background='tint'>
			<PageHeader title={t('AI_Center')} />
			<PageScrollableContentWithShadow padding={24}>
				<Box marginInline='auto' width='full'>
					{hasAILicense === false && (
						<Callout type='info' icon='stars' title={t('AI_Center_license_required_title')} marginBlockEnd={24}>
							<Box>{t('AI_Center_license_required_description')}</Box>
							<Button is='a' href={subscriptionHref} small marginBlockStart={12}>
								{t('View_options')}
							</Button>
						</Callout>
					)}
					<Box is='h2' fontScale='h3' marginBlockEnd={16}>
						{t('Capabilities')}
					</Box>
					<CardGrid breakpoints={{ xs: 4, sm: 4, md: 6, lg: 6, xl: 6 }}>
						<AICenterCapabilityCard
							icon='stars'
							title={t('Intelligent_Search')}
							description={t('AI_Center_Intelligent_Search_card_description')}
							status={aiSearchStatus}
							actionLabel={t('Configure')}
							href={searchSettingsHref}
						/>
						<AICenterCapabilityCard
							icon='smart'
							title={t('AI_Center_LLM_Providers')}
							description={t('AI_Center_LLM_Providers_card_description')}
							status={llmProviderStatus}
							actionLabel={t('Manage')}
							href={llmSettingsHref}
						/>
						<AICenterCapabilityCard
							icon='link'
							title={t('MCP')}
							description={t('AI_Center_MCP_card_description')}
							status={mcpStatus}
							actionLabel={t('Configure')}
							href={mcpSettingsHref}
						/>
					</CardGrid>
				</Box>
			</PageScrollableContentWithShadow>
		</Page>
	);
};

export default AICenterOverview;
