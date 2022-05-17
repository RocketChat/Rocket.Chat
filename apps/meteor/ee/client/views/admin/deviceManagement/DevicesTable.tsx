import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useCallback, useMemo } from 'react';

import GenericTable from '../../../../../client/components/GenericTable';
import DevicesRow from './DevicesRow';

const DevicesTable = (): ReactElement => {
	const t = useTranslation();

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
			<GenericTable.HeaderCell key={'name'}>
				{t('Clients')}
			</GenericTable.HeaderCell>,
			<GenericTable.HeaderCell key={'os'}>
				{t('OS')}
			</GenericTable.HeaderCell>,
			<GenericTable.HeaderCell key={'user'}>
				{t('User')}
			</GenericTable.HeaderCell>,
			mediaQuery && (
				<GenericTable.HeaderCell key={'loginAt'}>
					{t('Last_login')}
				</GenericTable.HeaderCell>
			),
			mediaQuery && (
				<GenericTable.HeaderCell key={'_id'}>
					{t('Device_Id')}
				</GenericTable.HeaderCell>
			),
			mediaQuery && (
				<GenericTable.HeaderCell key={'ip'}>
					{t('IP_Address')}
				</GenericTable.HeaderCell>
			),
		],
		[t, mediaQuery],
	);

	const renderRow = useCallback((props) => <DevicesRow {...props} />, []);

	return (
		<GenericTable
			header={headers}
			results={data && data.sessions}
			total={data && data.total}
			renderRow={renderRow}
		/>
	);
};

export default DevicesTable;

