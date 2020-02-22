import { Box, Chevron, Divider, Flex, Grid, Margins } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { CounterSet } from '../data/CounterSet';
import { CountGraph } from '../data/CountGraph';
import { HeatMap } from '../data/HeatMap';
import { Histogram } from '../data/Histogram';
import { Section } from '../Section';
import { StreamGraph } from '../data/StreamGraph';

export function UsersTab() {
	const t = useTranslation();

	return <>
		<Section title={t('New users')}>
			<CounterSet
				counters={[
					{
						count: Math.round(100 * Math.random()),
						variation: Math.round(20 * Math.random() - 10),
						description: t('Last 7 days'),
					},
					{
						count: Math.round(100 * Math.random()),
						variation: Math.round(20 * Math.random() - 10),
						description: t('Yesterday'),
					},
				]}
			/>
			<Flex.Container>
				<Box style={{ height: 240 }}>
					<CountGraph
						data={[
							[t('Monday'), Math.round(168 * Math.random())],
							[t('Tuesday'), Math.round(88 * Math.random())],
							[t('Wednesday'), Math.round(131 * Math.random())],
							[t('Thurday'), Math.round(145 * Math.random())],
							[t('Friday'), Math.round(26 * Math.random())],
							[t('Saturday'), Math.round(60 * Math.random())],
							[t('Sunday'), Math.round(50 * Math.random())],
						]}
					/>
				</Box>
			</Flex.Container>
		</Section>
		<Divider />
		<Section title={t('Active users')} filter={null}>
			<StreamGraph
				lastDate={new Date()}
				series={{
					[t('Daily Active Users')]: Array.from({ length: 21 }, () => Math.round(200 + 80 * Math.random())),
					[t('Weekly Active Users')]: Array.from({ length: 21 }, () => Math.round(220 + 80 * Math.random())),
					[t('Monthly Active Users')]: Array.from({ length: 21 }, () => Math.round(240 + 80 * Math.random())),
				}}
			/>
		</Section>
		<Divider />
		<Grid>
			<Grid.Item md={4}>
				<Section title={t('Users by time of day')}>
					<Flex.Container>
						<Box style={{ height: 696 }}>
							<HeatMap />
						</Box>
					</Flex.Container>
				</Section>
			</Grid.Item>
			<Grid.Item md={4}>
				<Section title={t('When is the chat busier?')}>
					<Flex.Container alignItems='center' justifyContent='center'>
						<Box>
							<Chevron left size='20' />
							<Margins inline='x8'>
								<Box is='span'>{t('Monday')}</Box>
							</Margins>
							<Chevron right size='20' />
						</Box>
					</Flex.Container>
					<Flex.Container>
						<Box style={{ height: 196 }}>
							<CountGraph
								data={[
									[t('8 AM'), Math.round(168 * Math.random())],
									[t('10 AM'), Math.round(88 * Math.random())],
									[t('12 AM'), Math.round(131 * Math.random())],
									[t('14 AM'), Math.round(145 * Math.random())],
									[t('15 AM'), Math.round(26 * Math.random())],
									[t('16 AM'), Math.round(60 * Math.random())],
									[t('17 AM'), Math.round(50 * Math.random())],
									[t('20 AM'), Math.round(50 * Math.random())],
								]}
							/>
						</Box>
					</Flex.Container>
				</Section>
				<Divider />
				<Section title={t('UTCs most used')}>
					<Flex.Container>
						<Box style={{ height: 196 }}>
							<Histogram />
						</Box>
					</Flex.Container>
				</Section>
			</Grid.Item>
		</Grid>
	</>;
}
