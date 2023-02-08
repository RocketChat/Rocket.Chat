import { Box, Field, TextInput, ButtonGroup, Button, Margins, Tabs, Flex } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import Page from '../../../client/components/Page';
import { useEndpointAction } from '../../../client/hooks/useEndpointAction';
import DirectTab from '../views/audit/components/tabs/DirectTab';
import RoomsTab from '../views/audit/components/tabs/RoomsTab';
import UsersTab from '../views/audit/components/tabs/UsersTab';
import VisitorsTab from '../views/audit/components/tabs/VisitorsTab';
import AuditResult from './AuditResult';
import DateRangePicker from '../views/audit/components/DateRangePicker';

// TODO: create more stories for the tabs
export const AuditPageBase = ({
	type,
	handleType,
	msg,
	handleMsg,
	handleDateRange,
	errors,
	rid,
	handleRid,
	users,
	handleUsers,
	onChangeUsers,
	visitor,
	handleVisitor,
	agent,
	handleAgent,
	apply,
	setData,
}) => {
	const t = useTranslation();

	const useHandleType = (type) =>
		useMutableCallback(() => {
			handleVisitor('');
			handleAgent();
			handleRid('');
			handleUsers([]);
			handleType(type);
		});

	const eventStats = useEndpointAction('POST', '/v1/statistics.telemetry');

	return (
		<Page>
			<Page.Header title={t('Message_auditing')} />
			<Tabs>
				<Tabs.Item selected={type === ''} onClick={useHandleType('')}>
					{t('Rooms')}
				</Tabs.Item>
				<Tabs.Item selected={type === 'u'} onClick={useHandleType('u')}>
					{t('Users')}
				</Tabs.Item>
				<Tabs.Item selected={type === 'd'} onClick={useHandleType('d')}>
					{t('Direct_Messages')}
				</Tabs.Item>
				<Tabs.Item selected={type === 'l'} onClick={useHandleType('l')}>
					{t('Omnichannel')}
				</Tabs.Item>
			</Tabs>
			<Page.ScrollableContentWithShadow mb='neg-x4'>
				<Margins block='x4'>
					<Box display='flex' flexDirection='row' mi='neg-x4' justifyContent='stretch'>
						<Margins inline='x4'>
							<Flex.Item shrink={1}>
								<Field>
									<Field.Label>{t('Message')}</Field.Label>
									<Field.Row>
										<TextInput value={msg} onChange={handleMsg} placeholder={t('Search')} />
									</Field.Row>
								</Field>
								<Field>
									<Field.Label>{t('Date')}</Field.Label>
									<Field.Row>
										<DateRangePicker onChange={handleDateRange} display='flex' flexGrow={1} />
									</Field.Row>
								</Field>
							</Flex.Item>
						</Margins>
					</Box>
					<Box display='flex' flexDirection='row' alignItems='flex-end'>
						<Flex.Item shrink={1}>
							{type === '' && <RoomsTab errors={errors} rid={rid} onChange={handleRid} />}
							{type === 'u' && <UsersTab errors={errors} users={users} onChangeUsers={onChangeUsers} />}
							{type === 'd' && <DirectTab errors={errors} users={users} onChangeUsers={onChangeUsers} />}
							{type === 'l' && (
								<VisitorsTab errors={errors} visitor={visitor} handleVisitor={handleVisitor} agent={agent} handleAgent={handleAgent} />
							)}
							<ButtonGroup mis='x8' align='end'>
								<Button
									primary
									onClick={() =>
										apply(() =>
											eventStats({
												params: [{ eventName: 'updateCounter', settingsId: 'Message_Auditing_Apply_Count', timestamp: Date.now() }],
											}),
										)
									}
								>
									{t('Apply')}
								</Button>
							</ButtonGroup>
						</Flex.Item>
					</Box>
					{setData && <AuditResult setDataRef={setData} />}
				</Margins>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};
