import { Box, Button, ButtonGroup, Skeleton } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors';
import React, { ReactElement } from 'react';

import Card from '../../../../../client/components/Card';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import UsagePieGraph from '../../../../../client/views/admin/info/UsagePieGraph';
import { useSeatsCap } from '../users/useSeatsCap';

const SeatsCard = (): ReactElement | null => {
	const t = useTranslation();
	const seatsCap = useSeatsCap();

	const seatsLeft = seatsCap ? seatsCap.maxActiveUsers - seatsCap.activeUsers : false;

	const isNearLimit = seatsCap && seatsCap.activeUsers / seatsCap.maxActiveUsers >= 0.8;

	const color = isNearLimit ? colors.r500 : undefined;

	if (seatsCap && seatsCap.maxActiveUsers === Infinity) {
		return null;
	}

	return (
		<Card>
			<Card.Title>{t('Seats_usage')}</Card.Title>
			<Card.Body>
				<Card.Col>
					<Card.Col.Section>
						<Box
							display='flex'
							flexDirection='row'
							justifyContent='center'
							fontScale={isNearLimit ? 'p2' : 'p1'}
						>
							{!seatsCap ? (
								<Skeleton variant='rect' width='x112' height='x112' />
							) : (
								<UsagePieGraph
									label={<Box color={color}>{`${seatsLeft} ${t('Seats_left')}`}</Box>}
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
					<Button small primary>
						{t('Request_seats')}
					</Button>
				</ButtonGroup>
			</Card.Footer>
		</Card>
	);
};

export default SeatsCard;
