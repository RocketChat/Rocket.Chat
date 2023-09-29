import { Box, Button, Icon, Tag } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors.json';
import { Card, CardBody, CardColSection, CardFooter, ExternalLink } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import React from 'react';
import { Trans } from 'react-i18next';

const PlanCard = (): ReactElement => {
	return (
		<Card>
			<CardBody flexDirection='column' mb={0}>
				<CardColSection display='flex' alignItems='center'>
					<Icon name='rocketchat' color={colors.r500} size={28} mie={4} />
					<Box fontScale='h3'>Enterprise</Box>
				</CardColSection>
				<CardColSection display='flex' flexDirection='column'>
					<Box fontScale='p2b' mb={4} display='flex'>
						<Box mie={8}>Trial period active </Box> <Tag>18 days left </Tag>
					</Box>
					<Box fontScale='p2' mb={4}>
						<Trans i18nKey='Finish_your_purchase'>
							Finish your purchase to avoid <ExternalLink to='https://go.rocket.chat/i/downgrade'>downgrade consequences.</ExternalLink>
						</Trans>
					</Box>
					<Box fontScale='p2' mb={4}>
						<Trans i18nKey='Why_has_a_trial_been_applied_to_this_workspace'>
							<ExternalLink to='https://go.rocket.chat/i/downgrade'>Why has a trial been applied to this workspace?</ExternalLink>
						</Trans>
					</Box>
					<Box fontScale='p2' display='flex' mb={4} alignItems='center'>
						<Icon name='calendar' size={24} mie={12} /> Renews 24 September, 2023
					</Box>
					<Box fontScale='p2' display='flex' mb={4} alignItems='center'>
						<Icon name='card' size={24} mie={12} /> $0 per month/user
					</Box>
					<Box fontScale='p2' display='flex' mb={4} alignItems='center'>
						<Icon name='cloud-plus' size={24} mie={12} /> Self-managed hosting
					</Box>
				</CardColSection>
			</CardBody>
			<CardFooter>
				<Button primary w='full' is='a' href='https://go.rocket.chat/i/purchase' target='_blank' rel='noopener noreferrer'>
					Finish purchase
				</Button>
			</CardFooter>
		</Card>
	);
};

export default PlanCard;
