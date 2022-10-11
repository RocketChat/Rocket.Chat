import { Box, ButtonGroup, Callout, Chip, Margins } from '@rocket.chat/fuselage';
import { ExternalLink } from '@rocket.chat/ui-client';
import { TranslationKey, useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import APIsDisplay from './APIsDisplay';
import ScreenshotCarouselAnchor from './components/ScreenshotCarouselAnchor';
import { AppInfo } from './definitions/AppInfo';

type AppDetailsProps = {
	app: AppInfo;
};

const AppDetails: FC<AppDetailsProps> = ({ app }) => {
	const {
		author: { homepage, support },
		detailedDescription,
		description,
		categories = [],
		screenshots,
		apis,
	} = app;

	const t = useTranslation();

	const isMarkdown = detailedDescription && Object.keys(detailedDescription).length !== 0 && detailedDescription.rendered;
	const isCarouselVisible = screenshots && Boolean(screenshots.length);

	return (
		<Box maxWidth='x640' w='full' marginInline='auto'>
			{app.licenseValidation && (
				<>
					{Object.entries(app.licenseValidation.warnings).map(([key]) => (
						<Callout key={key} type='warning'>
							{t(`Apps_License_Message_${key}` as TranslationKey)}
						</Callout>
					))}

					{Object.entries(app.licenseValidation.errors).map(([key]) => (
						<Callout key={key} type='danger'>
							{t(`Apps_License_Message_${key}` as TranslationKey)}
						</Callout>
					))}
				</>
			)}

			<Box display='flex' flexDirection='column'>
				<Margins block='x17'>
					{isCarouselVisible && <ScreenshotCarouselAnchor screenshots={screenshots} />}

					<Box is='section'>
						<Box fontScale='h4' mbe='x8'>
							{t('Description')}
						</Box>
						<Box dangerouslySetInnerHTML={{ __html: isMarkdown ? detailedDescription.rendered : description }} withRichContent />
					</Box>

					<Box is='section'>
						<Box fontScale='h4' mbe='x8'>
							{t('Categories')}
						</Box>
						<ButtonGroup medium flexWrap='wrap'>
							{categories?.map((current) => (
								<Chip key={current} textTransform='uppercase'>
									{current}
								</Chip>
							))}
						</ButtonGroup>
					</Box>

					<Box is='section'>
						<Box fontScale='h4' mbe='x8'>
							{t('Contact')}
						</Box>
						<Box display='flex' flexDirection='row' flexGrow={1} justifyContent='space-around' flexWrap='wrap'>
							<Box display='flex' flexDirection='column' mie='x12' flexGrow={1}>
								<Box fontScale='h4' color='hint'>
									{t('Author_Site')}
								</Box>
								<ExternalLink to={homepage} />
							</Box>
							<Box display='flex' flexDirection='column' flexGrow={1}>
								<Box fontScale='h4' color='hint'>
									{t('Support')}
								</Box>
								<ExternalLink to={support} />
							</Box>
						</Box>
					</Box>

					{apis?.length ? (
						<Box is='section'>
							<APIsDisplay apis={apis || []} />
						</Box>
					) : null}
				</Margins>
			</Box>
		</Box>
	);
};

export default AppDetails;
