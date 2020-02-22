import { Box, Icon, Pagination, Table } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { CounterSet } from '../data/CounterSet';
import { Growth } from '../data/Growth';
import { Section } from '../Section';

export function ChannelsTab() {
	const t = useTranslation();

	return <>
		<Section title={t('Overview')}>
			<CounterSet
				counters={[
					{
						count: Math.round(20 + 10 * Math.random()),
						variation: Math.round(10 * Math.random() - 20),
						description: t('Active channels'),
					},
					{
						count: Math.round(10 * Math.random()),
						variation: Math.round(20 * Math.random() - 10),
						description: t('Inactive channels'),
					},
					{
						count: Math.round(10 * Math.random()),
						variation: Math.round(20 * Math.random() - 10),
						description: t('New channels'),
					},
				]}
			/>
			<Box>
				<Table>
					<Table.Head>
						<Table.Row>
							<Table.Cell>{t('#')}</Table.Cell>
							<Table.Cell>{t('Channel')}</Table.Cell>
							<Table.Cell>{t('Created')}</Table.Cell>
							<Table.Cell>{t('Last active')}</Table.Cell>
							<Table.Cell>{t('Messages sent')}</Table.Cell>
						</Table.Row>
					</Table.Head>
					<Table.Body>
						<Table.Row>
							<Table.Cell>1.</Table.Cell>
							<Table.Cell>
								<Icon name='lock' /> {t('important')}
							</Table.Cell>
							<Table.Cell>Jun 1, 2018</Table.Cell>
							<Table.Cell>Oct 24, 2019</Table.Cell>
							<Table.Cell>
								323 <Growth>{323}</Growth>
							</Table.Cell>
						</Table.Row>
						<Table.Row>
							<Table.Cell>2.</Table.Cell>
							<Table.Cell>
								<Icon name='lock' /> {t('important')}
							</Table.Cell>
							<Table.Cell>Jun 1, 2018</Table.Cell>
							<Table.Cell>Oct 24, 2019</Table.Cell>
							<Table.Cell>
								323 <Growth>{323}</Growth>
							</Table.Cell>
						</Table.Row>
						<Table.Row>
							<Table.Cell>3.</Table.Cell>
							<Table.Cell>
								<Icon name='lock' /> {t('important')}
							</Table.Cell>
							<Table.Cell>Jun 1, 2018</Table.Cell>
							<Table.Cell>Oct 24, 2019</Table.Cell>
							<Table.Cell>
								323 <Growth>{323}</Growth>
							</Table.Cell>
						</Table.Row>
						<Table.Row>
							<Table.Cell>4.</Table.Cell>
							<Table.Cell>
								<Icon name='lock' /> {t('important')}
							</Table.Cell>
							<Table.Cell>Jun 1, 2018</Table.Cell>
							<Table.Cell>Oct 24, 2019</Table.Cell>
							<Table.Cell>
								323 <Growth>{-323}</Growth>
							</Table.Cell>
						</Table.Row>
						<Table.Row>
							<Table.Cell>5.</Table.Cell>
							<Table.Cell>
								<Icon name='lock' /> {t('important')}
							</Table.Cell>
							<Table.Cell>Jun 1, 2018</Table.Cell>
							<Table.Cell>Oct 24, 2019</Table.Cell>
							<Table.Cell>
								323 <Growth>{323}</Growth>
							</Table.Cell>
						</Table.Row>
						<Table.Row>
							<Table.Cell>6.</Table.Cell>
							<Table.Cell>
								<Icon name='lock' /> {t('important')}
							</Table.Cell>
							<Table.Cell>Jun 1, 2018</Table.Cell>
							<Table.Cell>Oct 24, 2019</Table.Cell>
							<Table.Cell>
								323 <Growth>{323}</Growth>
							</Table.Cell>
						</Table.Row>
						<Table.Row>
							<Table.Cell>7.</Table.Cell>
							<Table.Cell>
								<Icon name='lock' /> {t('important')}
							</Table.Cell>
							<Table.Cell>Jun 1, 2018</Table.Cell>
							<Table.Cell>Oct 24, 2019</Table.Cell>
							<Table.Cell>
								323 <Growth>{323}</Growth>
							</Table.Cell>
						</Table.Row>
						<Table.Row>
							<Table.Cell>8.</Table.Cell>
							<Table.Cell>
								<Icon name='lock' /> {t('important')}
							</Table.Cell>
							<Table.Cell>Jun 1, 2018</Table.Cell>
							<Table.Cell>Oct 24, 2019</Table.Cell>
							<Table.Cell>
								323 <Growth>{323}</Growth>
							</Table.Cell>
						</Table.Row>
					</Table.Body>
				</Table>
				<Pagination count={500} />
			</Box>
		</Section>

	</>;
}
