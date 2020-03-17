import { Box, Grid, Margins, Table } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { PieChart } from '../data/PieChart';
import { Section } from '../Section';

export function MessagesAndReactionsSection() {
	const t = useTranslation();

	return <Section title={t('Messages vs Reactions')}>
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
	</Section>;
}
