import { Box, Chevron, Divider, Flex, Margins } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { CountGraph } from '../data/CountGraph';
import { Histogram } from '../data/Histogram';
import { Section } from '../Section';
import { NewUsersSection } from './NewUsersSection';
import { ActiveUsersSection } from './ActiveUsersSection';
import { UsersByTimeOfTheDaySection } from './UsersByTimeOfTheDaySection';

export function UsersTab() {
	const t = useTranslation();

	return <>
		<NewUsersSection />
		<Divider />
		<ActiveUsersSection />
		<Divider />
		<Flex.Container>
			<Margins inline='x12'>
				<Box>
					<Margins inline='x12'>
						<Flex.Item grow={1} shrink={0} basis='0'>
							<UsersByTimeOfTheDaySection />
						</Flex.Item>
						<Flex.Item grow={1} shrink={0} basis='0'>
							<Box>
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
							</Box>
						</Flex.Item>
					</Margins>
				</Box>
			</Margins>
		</Flex.Container>
	</>;
}
