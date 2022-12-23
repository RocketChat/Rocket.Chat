import { Box, Button, ButtonGroup, Skeleton } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors';
import { ExternalLink, Card } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import UsagePieGraph from '../../../../../client/views/admin/info/UsagePieGraph';
import { useRequestSeatsLink } from '../users/useRequestSeatsLink';
import { useSeatsCap } from '../users/useSeatsCap';

const SeatsCard = (): ReactElement | null => {
	const t = useTranslation();
	const seatsCap = useSeatsCap();
	const requestSeatsLink = useRequestSeatsLink();

	const seatsLeft = seatsCap && Math.max(seatsCap.maxActiveUsers - seatsCap.activeUsers, 0);

	const isNearLimit = seatsCap && seatsCap.activeUsers / seatsCap.maxActiveUsers >= 0.8;

	const color = isNearLimit ? colors.d500 : undefined;

	if (seatsCap && seatsCap.maxActiveUsers === Infinity) {
		return null;
	}

	return (
		<Card>
			<Card.Title>{t('Seats_usage')}</Card.Title>
			<Card.Body>
				<Card.Col>
					<Card.Col.Section>
						<Box display='flex' flexDirection='row' justifyContent='center' fontScale={isNearLimit ? 'p2m' : 'p2'}>
							{!seatsCap ? (
								<Skeleton variant='rect' width='x112' height='x112' />
							) : (
								<UsagePieGraph
									label={<Box color={color}>{t('Seats_Available', { seatsLeft })}</Box>}
									used={seatsCap.activeUsers}
									total={seatsCap.maxActiveUsers}
									size={140}
									color={color}
								/>
							)}
						</Box>
					</Card.Col.Section>
				</Card.Col>
			</Card.Body>
			<Card.Footer>
				<ButtonGroup align='end'>
					<ExternalLink to={requestSeatsLink}>
						<Button small primary>
							{t('Request_seats')}
						</Button>
					</ExternalLink>
				</ButtonGroup>
			</Card.Footer>
		</Card>
	);
};

export default SeatsCard;
