import { Box, Pagination, States, StatesAction, StatesActions, StatesIcon, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useState, useMemo, useEffect } from 'react';

import { GenericTable, GenericTableHeaderCell, GenericTableHeader, GenericTableBody } from '../../../../../client/components/GenericTable';
import { usePagination } from '../../../../../client/components/GenericTable/hooks/usePagination';
import { useSort } from '../../../../../client/components/GenericTable/hooks/useSort';
import DevicesRow from './DevicesRow';
import FilterByText from '/client/components/FilterByText';

const DevicesTable = (): ReactElement => {
	const t = useTranslation();
	const [text, setText] = useState('');
	const { current, itemsPerPage, setCurrent, setItemsPerPage, ...paginationProps } = usePagination();
	const { sortBy, sortDirection, setSort } = useSort<'clients' | 'os' | 'user' | 'loginAt'>('user');

	const query = useDebouncedValue(
		useMemo(
			() => ({
				query: text,
				sort: `{ "${sortBy}": ${sortDirection === 'asc' ? 1 : -1} }`,
				count: itemsPerPage,
				offset: current,
			}),
			[text, itemsPerPage, current, sortBy, sortDirection]
		),
		500,
	);

	useEffect(() => console.log("Query = ", query), [query]);

	const data = {
		"sessions": [
			{
				"instanceId": "YTR4ZLWo3ma2wtndA",
				"sessionId": "NnucGfkdj8hAyjjLJ",
				"day": 28,
				"month": 4,
				"year": 2022,
				"userId": "knecaPPCoAKwS7L6Q",
				"device": {
					"type": "browser",
					"name": "Chrome",
					"longVersion": "101.0.4951.41",
					"os": {
						"name": "Linux",
						"version": "x86_64"
					},
					"version": "101.0.4951"
				},
				"host": "localhost:3000",
				"ip": "127.0.0.1",
				"mostImportantRole": "admin",
				"roles": [
					"user",
					"admin"
				],
				"type": "computed-session",
				"_updatedAt": "2022-04-29T05:00:00.024Z",
				"createdAt": "2022-04-28T23:24:37.471Z",
				"loginAt": "2022-04-28T23:24:37.470Z",
				"_id": "NnucGfkdj8hAyjjLJ"
			},
			{
				"instanceId": "YTR4ZLWo3ma2wtndA",
				"sessionId": "HfqDWMFytsQRf4oYG",
				"day": 28,
				"month": 4,
				"year": 2022,
				"userId": "knecaPPCoAKwS7L6Q",
				"device": {
					"type": "browser",
					"name": "Chrome",
					"longVersion": "101.0.4951.41",
					"os": {
						"name": "Linux",
						"version": "x86_64"
					},
					"version": "101.0.4951"
				},
				"host": "localhost:3000",
				"ip": "127.0.0.1",
				"mostImportantRole": "admin",
				"roles": [
					"user",
					"admin"
				],
				"type": "computed-session",
				"_updatedAt": "2022-04-29T05:00:00.024Z",
				"createdAt": "2022-04-28T23:12:13.283Z",
				"loginAt": "2022-04-28T23:12:13.282Z",
				"_id": "HfqDWMFytsQRf4oYG"
			},
			{
				"instanceId": "BxpvvekYjtqzKcgTE",
				"sessionId": "p8LBxRykw3hmNkY5T",
				"day": 29,
				"month": 4,
				"year": 2022,
				"userId": "knecaPPCoAKwS7L6Q",
				"device": {
					"type": "browser",
					"name": "Chrome",
					"longVersion": "101.0.4951.41",
					"os": {
						"name": "Linux",
						"version": "x86_64"
					},
					"version": "101.0.4951"
				},
				"host": "localhost:3000",
				"ip": "127.0.0.1",
				"mostImportantRole": "admin",
				"roles": [
					"user",
					"admin"
				],
				"type": "session",
				"_updatedAt": "2022-04-29T17:07:23.532Z",
				"createdAt": "2022-04-29T17:06:46.718Z",
				"loginAt": "2022-04-29T17:06:46.717Z",
				"_id": "p8LBxRykw3hmNkY5T"
			},
			{
				"instanceId": "5Ja2KZeDuWanzWKYv",
				"sessionId": "RE8mvPy63vc6SpNCa",
				"day": 3,
				"month": 5,
				"year": 2022,
				"userId": "knecaPPCoAKwS7L6Q",
				"device": {
					"type": "browser",
					"name": "Chrome",
					"longVersion": "101.0.4951.41",
					"os": {
						"name": "Linux",
						"version": "x86_64"
					},
					"version": "101.0.4951"
				},
				"host": "localhost:3000",
				"ip": "127.0.0.1",
				"mostImportantRole": "admin",
				"roles": [
					"user",
					"admin"
				],
				"type": "session",
				"_updatedAt": "2022-05-03T15:10:08.876Z",
				"createdAt": "2022-05-03T15:10:08.875Z",
				"loginAt": "2022-05-03T15:10:08.860Z",
				"_id": "RE8mvPy63vc6SpNCa"
			},
			{
				"instanceId": "vKe4DwpF9fq3zAQfw",
				"sessionId": "QNYo4DRNWdkXYB8qo",
				"day": 29,
				"month": 4,
				"year": 2022,
				"userId": "knecaPPCoAKwS7L6Q",
				"device": {
					"type": "browser",
					"name": "Chrome",
					"longVersion": "101.0.4951.41",
					"os": {
						"name": "Linux",
						"version": "x86_64"
					},
					"version": "101.0.4951"
				},
				"host": "localhost:3000",
				"ip": "127.0.0.1",
				"mostImportantRole": "admin",
				"roles": [
					"user",
					"admin"
				],
				"type": "session",
				"_updatedAt": "2022-04-29T12:58:27.597Z",
				"createdAt": "2022-04-29T12:58:27.480Z",
				"loginAt": "2022-04-29T12:58:27.470Z",
				"_id": "QNYo4DRNWdkXYB8qo"
			},
			{
				"instanceId": "akXP49aSp4RCiTqji",
				"sessionId": "LDjX4kB8sgj3d5BJz",
				"day": 29,
				"month": 4,
				"year": 2022,
				"userId": "knecaPPCoAKwS7L6Q",
				"device": {
					"type": "browser",
					"name": "Chrome",
					"longVersion": "101.0.4951.41",
					"os": {
						"name": "Linux",
						"version": "x86_64"
					},
					"version": "101.0.4951"
				},
				"host": "localhost:3000",
				"ip": "127.0.0.1",
				"mostImportantRole": "admin",
				"roles": [
					"user",
					"admin"
				],
				"type": "session",
				"_updatedAt": "2022-04-29T17:25:10.425Z",
				"createdAt": "2022-04-29T17:24:51.558Z",
				"loginAt": "2022-04-29T17:24:51.558Z",
				"_id": "LDjX4kB8sgj3d5BJz"
			},
			{
				"instanceId": "Xq2GfrBDb7CfATwbu",
				"sessionId": "CXegHpN7a9zmv7ygC",
				"day": 28,
				"month": 4,
				"year": 2022,
				"userId": "knecaPPCoAKwS7L6Q",
				"device": {
					"type": "browser",
					"name": "Chrome",
					"longVersion": "101.0.4951.41",
					"os": {
						"name": "Linux",
						"version": "x86_64"
					},
					"version": "101.0.4951"
				},
				"host": "localhost:3000",
				"ip": "127.0.0.1",
				"mostImportantRole": "admin",
				"roles": [
					"user",
					"admin"
				],
				"type": "computed-session",
				"_updatedAt": "2022-04-29T05:00:00.024Z",
				"createdAt": "2022-04-28T22:57:43.048Z",
				"loginAt": "2022-04-28T22:57:43.047Z",
				"_id": "CXegHpN7a9zmv7ygC"
			},
			{
				"instanceId": "Pe5HumnbLT4HpdjJk",
				"sessionId": "kafd3eGBzTTuNRAxa",
				"day": 29,
				"month": 4,
				"year": 2022,
				"userId": "knecaPPCoAKwS7L6Q",
				"device": {
					"type": "browser",
					"name": "Chrome",
					"longVersion": "101.0.4951.41",
					"os": {
						"name": "Linux",
						"version": "x86_64"
					},
					"version": "101.0.4951"
				},
				"host": "localhost:3000",
				"ip": "127.0.0.1",
				"mostImportantRole": "admin",
				"roles": [
					"user",
					"admin"
				],
				"type": "session",
				"_updatedAt": "2022-04-29T14:25:36.432Z",
				"createdAt": "2022-04-29T14:25:36.432Z",
				"loginAt": "2022-04-29T14:25:36.431Z",
				"_id": "kafd3eGBzTTuNRAxa"
			}
		],
		"total": 8,
		"count": 10,
		"offset": 0,
		"success": true
	};

	const mediaQuery = useMediaQuery('(min-width: 1024px)');

	const headers = useMemo(
		() => [
			<GenericTableHeaderCell key={'clients'} direction={sortDirection} active={sortBy === 'clients'} onClick={setSort} sort='clients'>
				{t('Clients')}
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell key={'os'} direction={sortDirection} active={sortBy === 'os'} onClick={setSort} sort='os'>
				{t('OS')}
			</GenericTableHeaderCell>,
			<GenericTableHeaderCell key={'user'} direction={sortDirection} active={sortBy === 'user'} onClick={setSort} sort='user'>
				{t('User')}
			</GenericTableHeaderCell>,
			mediaQuery && (
				<GenericTableHeaderCell key={'loginAt'} direction={sortDirection} active={sortBy === 'loginAt'} onClick={setSort} sort='loginAt'>
					{t('Last_login')}
				</GenericTableHeaderCell>
			),
			mediaQuery && (
				<GenericTableHeaderCell key={'_id'}>
					{t('Device_Id')}
				</GenericTableHeaderCell>
			),
			mediaQuery && (
				<GenericTableHeaderCell key={'ip'}>
					{t('IP_Address')}
				</GenericTableHeaderCell>
			),
			<GenericTableHeaderCell width={'5%'} key='menu'>{' '}</GenericTableHeaderCell>
		],
		[t, mediaQuery],
	);

	if(!data) {
		return (
			<Box display='flex' justifyContent='center' alignItems='center' height='100%'>
				<States>
				<StatesIcon name='warning' variation='danger'/>
				<StatesTitle>{t('Something_Went_Wrong')}</StatesTitle>
				<StatesSubtitle>{t('We_Could_not_retrive_any_data')}</StatesSubtitle>
				<StatesActions>
					<StatesAction onClick={() => console.log('reload')}>{t('Retry')}</StatesAction>
				</StatesActions>
				</States>
			</Box>
		);
	};

	return (
		<>
			<FilterByText onChange={({ text }): void => setText(text)} />
			<GenericTable>
				<GenericTableHeader>
					{headers}
				</GenericTableHeader>
				<GenericTableBody>
					{data && data.sessions && data.sessions.map((session) => <DevicesRow key={session._id} {...session} />)}
				</GenericTableBody>
			</GenericTable>
			<Pagination
				current={current}
				itemsPerPage={itemsPerPage}
				count={data?.total || 0}
				onSetCurrent={setCurrent}
				onSetItemsPerPage={setItemsPerPage}
				{...paginationProps}
			/>
		</>
	);
};

export default DevicesTable;
