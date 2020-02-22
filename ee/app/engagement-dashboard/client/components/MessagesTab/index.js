import { Box, Divider, Flex, Grid, Icon, Margins, Table } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { CounterSet } from '../data/CounterSet';
import { CountGraph } from '../data/CountGraph';
import { PieChart } from '../data/PieChart';
import { Section } from '../Section';

export function MessagesTab() {
	const t = useTranslation();

	return <>
		<Section title={t('Messages sent')}>
			<CounterSet
				counters={[
					{
						count: Math.round(600 + 100 * Math.random()),
						variation: Math.round(10 * Math.random() - 20),
						description: t('Last 7 days'),
					},
					{
						count: Math.round(10 + 10 * Math.random()),
						variation: Math.round(20 * Math.random() - 10),
						description: t('Yesterday'),
					},
				]}
			/>
			<Flex.Container>
				<Box style={{ height: 240 }}>
					<CountGraph
						data={[
							['Monday', Math.round(168 * Math.random())],
							['Tuesday', Math.round(88 * Math.random())],
							['Wednesday', Math.round(131 * Math.random())],
							['Thurday', Math.round(145 * Math.random())],
							['Friday', Math.round(26 * Math.random())],
							['Saturday', Math.round(60 * Math.random())],
							['Sunday', Math.round(50 * Math.random())],
						]}
					/>
				</Box>
			</Flex.Container>
		</Section>
		<Divider />
		<Section title={t('Where are the messages be sent?')}>
			<Grid>
				<Grid.Item md={4}>
					<PieChart
						data={{
							[t('Private chats')]: 524,
							[t('Private channels')]: 242,
							[t('Public channels')]: 194,
						}}
					/>
				</Grid.Item>
				<Grid.Item md={4}>
					<Margins blockEnd='x16'>
						<Box textStyle='p1'>{t('Most popular Channels (Top5)')}</Box>
					</Margins>
					<Table>
						<Table.Head>
							<Table.Row>
								<Table.Cell>{t('#')}</Table.Cell>
								<Table.Cell>{t('Channel')}</Table.Cell>
								<Table.Cell align='end'>{t('Number of messages')}</Table.Cell>
							</Table.Row>
						</Table.Head>
						<Table.Body>
							<Table.Row>
								<Table.Cell>1.</Table.Cell>
								<Table.Cell>
									<Icon name='lock' /> {t('important')}
								</Table.Cell>
								<Table.Cell align='end'>333</Table.Cell>
							</Table.Row>
							<Table.Row>
								<Table.Cell>2.</Table.Cell>
								<Table.Cell>
									<Icon name='hashtag' /> {t('random')}
								</Table.Cell>
								<Table.Cell align='end'>234</Table.Cell>
							</Table.Row>
							<Table.Row>
								<Table.Cell>3.</Table.Cell>
								<Table.Cell>
									<Icon name='lock' /> {t('design.team')}
								</Table.Cell>
								<Table.Cell align='end'>43</Table.Cell>
							</Table.Row>
							<Table.Row>
								<Table.Cell>4.</Table.Cell>
								<Table.Cell>
									<Icon name='lock' /> {t('devops')}
								</Table.Cell>
								<Table.Cell align='end'>32</Table.Cell>
							</Table.Row>
							<Table.Row>
								<Table.Cell>5.</Table.Cell>
								<Table.Cell>
									<Icon name='lock' /> {t('mobile.team')}
								</Table.Cell>
								<Table.Cell align='end'>13</Table.Cell>
							</Table.Row>
						</Table.Body>
					</Table>
				</Grid.Item>
			</Grid>
		</Section>
		<Divider />
		<Section title={t('Messages vs Reactions')}>
			<Grid>
				<Grid.Item md={4}>
					<PieChart
						data={{
							[t('Messages sent')]: 524,
							[t('Reactions sent')]: 398,
						}}
					/>
				</Grid.Item>
				<Grid.Item md={4}>
					<Margins blockEnd='x16'>
						<Box textStyle='p1'>{t('Most sent reactions (Top5)')}</Box>
					</Margins>
					<Table>
						<Table.Head>
							<Table.Row>
								<Table.Cell>{t('#')}</Table.Cell>
								<Table.Cell>{t('Reaction')}</Table.Cell>
								<Table.Cell align='end'>{t('Number of times')}</Table.Cell>
							</Table.Row>
						</Table.Head>
						<Table.Body>
							<Table.Row>
								<Table.Cell>1.</Table.Cell>
								<Table.Cell>
									:clap:
								</Table.Cell>
								<Table.Cell align='end'>333</Table.Cell>
							</Table.Row>
							<Table.Row>
								<Table.Cell>2.</Table.Cell>
								<Table.Cell>
									:+1:
								</Table.Cell>
								<Table.Cell align='end'>234</Table.Cell>
							</Table.Row>
							<Table.Row>
								<Table.Cell>3.</Table.Cell>
								<Table.Cell>
									:rocket:
								</Table.Cell>
								<Table.Cell align='end'>43</Table.Cell>
							</Table.Row>
							<Table.Row>
								<Table.Cell>4.</Table.Cell>
								<Table.Cell>
									:scream:
								</Table.Cell>
								<Table.Cell align='end'>32</Table.Cell>
							</Table.Row>
							<Table.Row>
								<Table.Cell>5.</Table.Cell>
								<Table.Cell>
									:tada:
								</Table.Cell>
								<Table.Cell align='end'>13</Table.Cell>
							</Table.Row>
						</Table.Body>
					</Table>
				</Grid.Item>
			</Grid>
		</Section>
	</>;
}
