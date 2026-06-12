/* eslint-disable react/no-multi-comp */
import { AI_LICENSE_MODULE } from '@rocket.chat/ai-search';
import { Box, Button, Callout, Card, CardBody, CardControls, CardGrid, CardTitle, Icon, Tag } from '@rocket.chat/fuselage';
import { Page, PageHeader, PageScrollableContentWithShadow } from '@rocket.chat/ui-client';
import { useIsPrivilegedSettingsContext, useRouteParameter, useRouter, useSetting } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import EditableSettingsProvider from '../settings/EditableSettingsProvider';
import GenericGroupPage from '../settings/groups/GenericGroupPage';

type CapabilityCardProps = {
	icon: ComponentProps<typeof Icon>['name'];
	title: string;
	description: string;
	status?: ReactElement;
	actionLabel: string;
	disabled?: boolean;
	onClick?: () => void;
};

const CapabilityCard = ({ icon, title, description, status, actionLabel, disabled, onClick }: CapabilityCardProps): ReactElement => (
	<Card role='region' style={{ height: '100%', minHeight: 220 }}>
		<Box display='flex' flexDirection='column' p={16} height='full'>
			<Box display='flex' alignItems='center' justifyContent='space-between' mbe={12}>
				<Box bg='surface-selected' borderRadius={4} size='x40' display='flex' alignItems='center' justifyContent='center'>
					<Icon name={icon} size='x24' color='primary' />
				</Box>
				{status}
			</Box>
			<CardTitle>{title}</CardTitle>
			<Box flexGrow={1}>
				<CardBody flexDirection='column'>
					<Box color='hint' fontScale='p2'>
						{description}
					</Box>
				</CardBody>
			</Box>
			<Box mbs='auto'>
				<CardControls>
					<Button small disabled={disabled} onClick={onClick}>
						{actionLabel}
					</Button>
				</CardControls>
			</Box>
		</Box>
	</Card>
);

const AICenterOverview = (): ReactElement => {
	const { t } = useTranslation();
	const router = useRouter();
	const { data: hasAILicense = false } = useHasLicenseModule(AI_LICENSE_MODULE);
	const intelligentSearchEnabled = useSetting('AI_Intelligent_Search_Enabled', false);

	let premiumStatus = <Tag>{t('Disabled')}</Tag>;
	if (!hasAILicense) {
		premiumStatus = <Tag variant='danger'>{t('Locked')}</Tag>;
	} else if (intelligentSearchEnabled) {
		premiumStatus = <Tag variant='primary'>{t('Enabled')}</Tag>;
	}

	return (
		<Page background='tint'>
			<PageHeader title={t('AI_Center')} />
			<PageScrollableContentWithShadow p={24}>
				<Box marginInline='auto' width='full'>
					{!hasAILicense && (
						<Callout type='info' icon='stars' title={t('AI_Center_license_required_title')} mbe={16}>
							<Box display='flex' alignItems='center' justifyContent='space-between'>
								<Box mie={16}>{t('AI_Center_license_required_description')}</Box>
								<Button small onClick={() => router.navigate('/admin/subscription')}>
									{t('View_options')}
								</Button>
							</Box>
						</Callout>
					)}
					<Box display='flex' alignItems='center' mbe={16}>
						<Box is='h2' fontScale='h3' mie={12}>
							{t('Capabilities')}
						</Box>
					</Box>
					<CardGrid breakpoints={{ xs: 4, sm: 4, md: 6, lg: 6, xl: 6 }}>
						<CapabilityCard
							icon='stars'
							title={t('Intelligent_Search')}
							description={t('AI_Center_Intelligent_Search_card_description')}
							status={premiumStatus}
							actionLabel={t('Configure')}
							onClick={() => router.navigate('/admin/ai-center/search')}
						/>
						<CapabilityCard
							icon='smart'
							title={t('AI_Center_LLM_Providers')}
							description={t('AI_Center_LLM_Providers_card_description')}
							status={<Tag>{t('Available')}</Tag>}
							actionLabel={t('Manage')}
							onClick={() => router.navigate('/admin/ai-center/llm-providers')}
						/>
					</CardGrid>
				</Box>
			</PageScrollableContentWithShadow>
		</Page>
	);
};

const AISettingsSection = ({ section }: { section: 'Intelligent_Search' | 'AI_LLM_Provider' }): ReactElement => {
	const router = useRouter();
	const titleBySection = {
		Intelligent_Search: 'Intelligent_Search',
		AI_LLM_Provider: 'AI_Center_LLM_Providers',
	} as const;
	const title = titleBySection[section];

	return (
		<EditableSettingsProvider>
			<GenericGroupPage _id='AI_Center' i18nLabel={title} sections={[section]} onClickBack={() => router.navigate('/admin/ai-center')} />
		</EditableSettingsProvider>
	);
};

const AICenterRoute = (): ReactElement => {
	const hasPermission = useIsPrivilegedSettingsContext();
	const section = useRouteParameter('section');

	if (!hasPermission) {
		return <NotAuthorizedPage />;
	}

	if (section === 'search') {
		return <AISettingsSection section='Intelligent_Search' />;
	}

	if (section === 'thread-summarization') {
		return <AICenterOverview />;
	}

	if (section === 'llm-providers') {
		return <AISettingsSection section='AI_LLM_Provider' />;
	}

	return <AICenterOverview />;
};

export default AICenterRoute;
