import { Box, Callout, Chip, Margins } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import ExternalLink from '../../../components/ExternalLink';
import { TranslationKey, useTranslation } from '../../../contexts/TranslationContext';
import { App } from './types';

type AppDetailsPageContentProps = {
	app: App;
};

const AppDetailsPageContent: FC<AppDetailsPageContentProps> = ({ app }) => {
	const t = useTranslation();

	const {
		author: { homepage, support },
		detailedDescription,
		description,
		categories = [],
	} = app;

	const isMarkdown = detailedDescription && Object.keys(detailedDescription).length !== 0 && detailedDescription.rendered;

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
					<Box is='section'>
						<Box fontScale='h4' mbe='x8'>
							{t('Description')}
						</Box>
						<Box
							display='flex'
							flexDirection='row'
							mbe='neg-x16'
							dangerouslySetInnerHTML={{ __html: isMarkdown ? detailedDescription.rendered : description }}
						/>
					</Box>

					<Box is='section'>
						<Box fontScale='h4' mbe='x8'>
							{t('Categories')}
						</Box>
						<Box display='flex' flexDirection='row'>
							{categories?.map((current) => (
								<Chip key={current} textTransform='uppercase' mie='x8'>
									<Box color='hint'>{current}</Box>
								</Chip>
							))}
						</Box>
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
				</Margins>
			</Box>
		</Box>
	);
};

export default AppDetailsPageContent;
