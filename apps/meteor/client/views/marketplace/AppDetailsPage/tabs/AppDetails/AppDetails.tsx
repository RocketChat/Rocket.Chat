import type { App } from '@rocket.chat/core-typings';
import { Box, Button, Callout, Chip, Margins, Skeleton } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import DOMPurify from 'dompurify';
import React from 'react';
import { useTranslation } from 'react-i18next';

import AppDetailsAPIs from './AppDetailsAPIs';
import NormalizedLink from './NormalizedLink';
import { useHasLicenseModule } from '../../../../../hooks/useHasLicenseModule';
import { GET_ADDONS_LINK } from '../../../../admin/subscription/utils/links';
import ScreenshotCarouselAnchor from '../../../components/ScreenshotCarouselAnchor';
import { useAppQuery } from '../../../hooks/useAppQuery';
import { useAppScreenshotsQuery } from '../../../hooks/useAppScreenshotsQuery';
import { purifyOptions } from '../../../lib/purifyOptions';

type AppDetailsProps = {
	appId: App['id'];
};

const AppDetails = ({ appId }: AppDetailsProps) => {
	const { isLoading, isSuccess, data } = useAppQuery(appId);
	const { isLoading: isScreenshotsLoading, isSuccess: isScreenshotsSuccess, data: screenshots } = useAppScreenshotsQuery(appId);

	const { t } = useTranslation();
	const appAddon = data?.installed ? data?.installedAddon : data?.addon;
	const workspaceHasAddon = useHasLicenseModule(appAddon);

	return (
		<Box mbs={36} maxWidth='x640' w='full' marginInline='auto' color='default'>
			{isSuccess && (
				<>
					{data.addon && !workspaceHasAddon && (
						<Callout
							mb={16}
							title={t('Subscription_add-on_required')}
							type='info'
							actions={
								<Button is='a' target='_blank' rel='noopener noreferrer' small href={GET_ADDONS_LINK}>
									{t('Contact_sales')}
								</Button>
							}
						>
							{t('App_cannot_be_enabled_without_add-on')}
						</Callout>
					)}

					{data.licenseValidation && (
						<>
							{Object.entries(data.licenseValidation.warnings).map(([key]) => (
								<Callout key={key} type='warning' mb={16}>
									{t(`Apps_License_Message_${key}` as TranslationKey)}
								</Callout>
							))}

							{Object.entries(data.licenseValidation.errors).map(([key]) => (
								<Callout key={key} type='danger' mb={16}>
									{t(`Apps_License_Message_${key}` as TranslationKey)}
								</Callout>
							))}
						</>
					)}
				</>
			)}

			<Box display='flex' flexDirection='column'>
				<Margins block={16}>
					{isScreenshotsLoading && (
						<Skeleton variant='rect' width='100%' maxWidth={640} height={0} paddingBlockEnd={`${(540 / 960) * 100}%`} />
					)}
					{isScreenshotsSuccess && screenshots.length > 0 && <ScreenshotCarouselAnchor screenshots={screenshots} />}

					<Box is='section'>
						<Box fontScale='h4' mbe={8} color='titles-labels'>
							{t('Description')}
						</Box>
						{isLoading && <Skeleton variant='text' />}
						{isSuccess && (
							<Box
								dangerouslySetInnerHTML={{
									__html:
										typeof data.detailedDescription === 'object' &&
										data.detailedDescription !== null &&
										'rendered' in data.detailedDescription
											? DOMPurify.sanitize(data.detailedDescription.rendered, purifyOptions)
											: DOMPurify.sanitize(data.description, purifyOptions),
								}}
								withRichContent
							/>
						)}
					</Box>

					{isSuccess && data.categories && (
						<Box is='section'>
							<Box fontScale='h4' mbe={8} color='titles-labels'>
								{t('Categories')}
							</Box>
							<Box display='flex' flexDirection='row' flexWrap='wrap' justifyContent='start' alignItems='center'>
								{data.categories?.map((category) => (
									<Chip key={category} textTransform='uppercase' m={4}>
										{category}
									</Chip>
								))}
							</Box>
						</Box>
					)}

					{isSuccess && (
						<Box is='section'>
							<Box fontScale='h4' mbe={8}>
								{t('Contact')}
							</Box>
							<Box display='flex' flexDirection='row' flexGrow={1} justifyContent='space-around' flexWrap='wrap' mbe={24}>
								{data.author.homepage && (
									<Box display='flex' flexDirection='column' mie={12} flexGrow={1}>
										<Box fontScale='h4' color='hint'>
											{t('Author_Site')}
										</Box>
										<NormalizedLink href={data.author.homepage} />
									</Box>
								)}
								{data.author.support && (
									<Box display='flex' flexDirection='column' flexGrow={1}>
										<Box fontScale='h4' color='hint'>
											{t('Support')}
										</Box>
										<NormalizedLink href={data.author.support} />
									</Box>
								)}
							</Box>

							{data.documentationUrl && (
								<>
									<Box fontScale='h4' color='hint'>
										{t('Documentation')}
									</Box>
									<NormalizedLink href={data.documentationUrl} />
								</>
							)}
						</Box>
					)}

					<AppDetailsAPIs appId={appId} />
				</Margins>
			</Box>
		</Box>
	);
};

export default AppDetails;
