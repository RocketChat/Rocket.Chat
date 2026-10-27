import { Box, Button, Callout, Chip } from '@rocket.chat/fuselage';
import { ExternalLink } from '@rocket.chat/ui-client';
import DOMPurify from 'dompurify';
import { useTranslation } from 'react-i18next';

import AppDetailsAPIs from './AppDetailsAPIs';
import { normalizeUrl } from './normalizeUrl';
import { useExternalLink } from '../../../../../hooks/useExternalLink';
import { useHasLicenseModule } from '../../../../../hooks/useHasLicenseModule';
import { GET_ADDONS_LINK } from '../../../../admin/subscription/utils/links';
import ScreenshotCarouselAnchor from '../../../components/ScreenshotCarouselAnchor';
import type { AppInfo } from '../../../definitions/AppInfo';
import { purifyOptions } from '../../../lib/purifyOptions';

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
		<Box marginBlockStart='x32' maxWidth='x640' width='full' marginInline='auto' color='default'>
			{(showAddonCallout || licenseWarnings.length > 0 || licenseErrors.length > 0) && (
				<Box display='flex' flexDirection='column' gap='x16' marginBlock='x16'>
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
				</Box>
			)}

			<Box display='flex' flexDirection='column' gap='x32' paddingBlock='x16'>
				{isCarouselVisible && <ScreenshotCarouselAnchor screenshots={screenshots} />}

				<Box is='section'>
					<Box fontScale='h4' marginBlockEnd='x8' color='titles-labels'>
						{t('Description')}
					</Box>
					<Box
						dangerouslySetInnerHTML={{
							__html: isMarkdown
								? DOMPurify.sanitize(detailedDescription.rendered, purifyOptions)
								: DOMPurify.sanitize(description, purifyOptions),
						}}
						withRichContent
					/>
				</Box>

				<Box is='section'>
					<Box fontScale='h4' marginBlockEnd='x8' color='titles-labels'>
						{t('Categories')}
					</Box>
					<Box
						display='flex'
						flexDirection='row'
						flexWrap='wrap'
						justifyContent='start'
						alignItems='center'
						gap='x8'
						padding={categories.length > 0 ? 'x4' : undefined}
					>
						{categories.map((current) => (
							<Chip key={current} label>
								{current}
							</Chip>
						))}
					</Box>
				</Box>

				<Box is='section'>
					<Box fontScale='h4' marginBlockEnd='x8'>
						{t('Contact')}
					</Box>
					<Box display='flex' flexDirection='row' flexGrow={1} justifyContent='space-around' flexWrap='wrap' marginBlockEnd='x24'>
						<Box display='flex' flexDirection='column' marginInlineEnd='x12' flexGrow={1}>
							<Box fontScale='h4' color='hint'>
								{t('Author_Site')}
							</Box>
							{normalizedHomepageUrl ? <ExternalLink to={normalizedHomepageUrl}>{homepage}</ExternalLink> : homepage}
						</Box>
						<Box display='flex' flexDirection='column' flexGrow={1}>
							<Box fontScale='h4' color='hint'>
								{t('Support')}
							</Box>
							{normalizedSupportUrl ? <ExternalLink to={normalizedSupportUrl}>{support}</ExternalLink> : support}
						</Box>
					</Box>
					<>
						<Box fontScale='h4' color='hint'>
							{t('Documentation')}
						</Box>
						{normalizedDocumentationUrl ? <ExternalLink to={normalizedDocumentationUrl}>{documentation}</ExternalLink> : documentation}
					</>
				</Box>

				{apis?.length ? (
					<Box is='section'>
						<AppDetailsAPIs apis={apis || []} />
					</Box>
				) : null}
			</Box>
		</Box>
	);
};

export default AppDetails;
