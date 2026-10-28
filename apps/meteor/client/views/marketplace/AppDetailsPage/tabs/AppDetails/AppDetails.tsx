import { Button, Callout, Chip, Stack, Text } from '@rocket.chat/fuselage';
import { ExternalLink } from '@rocket.chat/ui-client';
import DOMPurify from 'dompurify';
import { useTranslation } from 'react-i18next';

import AppDetailsAPIs from './AppDetailsAPIs';
import AppCategoryList from './layout/AppCategoryList';
import AppContactRow from './layout/AppContactRow';
import { normalizeUrl } from './normalizeUrl';
import { useExternalLink } from '../../../../../hooks/useExternalLink';
import { useHasLicenseModule } from '../../../../../hooks/useHasLicenseModule';
import { GET_ADDONS_LINK } from '../../../../admin/subscription/utils/links';
import ScreenshotCarouselAnchor from '../../../components/ScreenshotCarouselAnchor';
import type { AppInfo } from '../../../definitions/AppInfo';
import { purifyOptions } from '../../../lib/purifyOptions';
import AppDetailsTabPanel from '../../layout/AppDetailsTabPanel';
import AppInfoSection from '../../layout/AppInfoSection';
import AppInfoSections from '../../layout/AppInfoSections';
import RichContent from '../../layout/RichContent';

export type AppDetailsProps = {
	app: AppInfo;
};

const AppDetails = ({ app }: AppDetailsProps) => {
	const { t } = useTranslation();
	const {
		author: { homepage, support } = {},
		detailedDescription,
		description,
		categories = [],
		screenshots,
		apis,
		documentationUrl: documentation,
		addon,
		installedAddon,
		installed,
	} = app;

	const isMarkdown = detailedDescription && Object.keys(detailedDescription).length !== 0 && detailedDescription.rendered;
	const isCarouselVisible = screenshots && Boolean(screenshots.length);

	const normalizedHomepageUrl = homepage ? normalizeUrl(homepage) : undefined;
	const normalizedSupportUrl = support ? normalizeUrl(support) : undefined;
	const normalizedDocumentationUrl = documentation ? normalizeUrl(documentation) : undefined;

	const appAddon = installed ? installedAddon : addon;

	const { data: workspaceHasAddon = false } = useHasLicenseModule(appAddon);

	const openExternalLink = useExternalLink();

	const showAddonCallout = !!appAddon && !workspaceHasAddon;
	const licenseWarnings = Object.keys(app.licenseValidation?.warnings ?? {});
	const licenseErrors = Object.keys(app.licenseValidation?.errors ?? {});

	return (
		<AppDetailsTabPanel offset>
			<AppInfoSections>
				{(showAddonCallout || licenseWarnings.length > 0 || licenseErrors.length > 0) && (
					<Stack gap='x16'>
						{showAddonCallout && (
							<Callout
								title={t('Subscription_add-on_required')}
								type='info'
								actions={
									<Button size='small' onClick={() => openExternalLink(GET_ADDONS_LINK)}>
										{t('Contact_sales')}
									</Button>
								}
							>
								{t('App_cannot_be_enabled_without_add-on')}
							</Callout>
						)}
						{licenseWarnings.map((key) => (
							<Callout key={key} type='warning'>
								{t(`Apps_License_Message_${key}`)}
							</Callout>
						))}
						{licenseErrors.map((key) => (
							<Callout key={key} type='danger'>
								{t(`Apps_License_Message_${key}`)}
							</Callout>
						))}
					</Stack>
				)}

				{isCarouselVisible && <ScreenshotCarouselAnchor screenshots={screenshots} />}

				<AppInfoSection
					title={
						<Text fontScale='h4' color='titles-labels'>
							{t('Description')}
						</Text>
					}
				>
					<RichContent
						dangerouslySetInnerHTML={{
							__html: isMarkdown
								? DOMPurify.sanitize(detailedDescription.rendered, purifyOptions)
								: DOMPurify.sanitize(description, purifyOptions),
						}}
					/>
				</AppInfoSection>

				<AppInfoSection
					title={
						<Text fontScale='h4' color='titles-labels'>
							{t('Categories')}
						</Text>
					}
				>
					{categories.length > 0 && (
						<AppCategoryList>
							{categories.map((current) => (
								<Chip key={current} label>
									{current}
								</Chip>
							))}
						</AppCategoryList>
					)}
				</AppInfoSection>

				<AppInfoSection title={<Text fontScale='h4'>{t('Contact')}</Text>}>
					<AppContactRow>
						<>
							<Text fontScale='h4' color='hint'>
								{t('Author_Site')}
							</Text>
							{normalizedHomepageUrl ? <ExternalLink to={normalizedHomepageUrl}>{homepage}</ExternalLink> : homepage}
						</>
						<>
							<Text fontScale='h4' color='hint'>
								{t('Support')}
							</Text>
							{normalizedSupportUrl ? <ExternalLink to={normalizedSupportUrl}>{support}</ExternalLink> : support}
						</>
					</AppContactRow>
					<Text fontScale='h4' color='hint'>
						{t('Documentation')}
					</Text>
					{normalizedDocumentationUrl ? <ExternalLink to={normalizedDocumentationUrl}>{documentation}</ExternalLink> : documentation}
				</AppInfoSection>

				{apis?.length ? (
					<AppInfoSection>
						<AppDetailsAPIs apis={apis || []} />
					</AppInfoSection>
				) : null}
			</AppInfoSections>
		</AppDetailsTabPanel>
	);
};

export default AppDetails;
