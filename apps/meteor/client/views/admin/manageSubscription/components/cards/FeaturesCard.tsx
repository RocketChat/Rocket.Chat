import { Box } from '@rocket.chat/fuselage';
import { CardCol, CardColSection, CardFooter, ExternalLink, FramedIcon } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import React from 'react';
import { Trans } from 'react-i18next';

import FeatureUsageCard from '../FeatureUsageCard';

const FeaturesCard = (): ReactElement => {
	return (
		<FeatureUsageCard title='Includes'>
			<CardColSection h='full' w='full' display='flex' flexDirection='column'>
				<CardCol>
					<Box maxHeight={120} display='flex' flexDirection='column' flexWrap='wrap'>
						<Box display='flex' alignItems='center' mbe={4}>
							<FramedIcon type='neutral' icon='lock' />
							<Box is='p' fontScale='p2' mis={12} color='font-secondary-info'>
								White-label branding
							</Box>
						</Box>
						<Box display='flex' alignItems='center' mbe={4}>
							<FramedIcon type='success' icon='check' />
							<Box is='p' fontScale='p2' mis={12}>
								Unlimited users
							</Box>
						</Box>
						<Box display='flex' alignItems='center' mbe={4}>
							<FramedIcon type='success' icon='check' />
							<Box is='p' fontScale='p2' mis={12}>
								Unlimited users
							</Box>
						</Box>
						<Box display='flex' alignItems='center' mbe={4}>
							<FramedIcon type='success' icon='check' />
							<Box is='p' fontScale='p2' mis={12}>
								Unlimited users
							</Box>
						</Box>
						<Box display='flex' alignItems='center' mbe={4}>
							<FramedIcon type='success' icon='check' />
							<Box is='p' fontScale='p2' mis={12}>
								Unlimited users
							</Box>
						</Box>
						<Box display='flex' alignItems='center' mbe={4}>
							<FramedIcon type='success' icon='check' />
							<Box is='p' fontScale='p2' mis={12}>
								Unlimited users
							</Box>
						</Box>
					</Box>
				</CardCol>
				<CardFooter>
					<Trans i18nKey='Compare_plans'>
						<ExternalLink to='https://go.rocket.chat/i/downgrade'>
							<Box is='span' textDecoration='underline'>
								Compare plans
							</Box>
						</ExternalLink>
					</Trans>
				</CardFooter>
			</CardColSection>
		</FeatureUsageCard>
	);
};

export default FeaturesCard;
