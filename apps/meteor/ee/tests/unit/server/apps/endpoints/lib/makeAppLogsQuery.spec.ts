import type { AppLogsProps } from '@rocket.chat/rest-typings';
import { expect } from 'chai';

import { makeAppLogsQuery } from '../../../../../../server/apps/communication/endpoints/lib/makeAppLogsQuery';

describe('makeAppLogsQuery', () => {
	const appId = 'test-app-id';

	it('should return an empty object when no parameters are provided', () => {
		const queryParams: AppLogsProps = {};
		const result = makeAppLogsQuery(queryParams);
		expect(result).to.deep.equal({});
	});

	it('should create a basic query with appId', () => {
		const queryParams: AppLogsProps = { appId };
		const result = makeAppLogsQuery(queryParams);

		expect(result).to.deep.equal({ appId });
	});

	it('should include log level filter when logLevel is provided', () => {
		const queryParams: AppLogsProps = { logLevel: '1' };
		const result = makeAppLogsQuery(queryParams);

		expect(result).to.deep.equal({
			'entries.severity': { $in: ['error', 'warn', 'info', 'log'] },
		});
	});

	it('should include all log levels when logLevel is 2', () => {
		const queryParams: AppLogsProps = { logLevel: '2' };
		const result = makeAppLogsQuery(queryParams);

		expect(result).to.deep.equal({
			'entries.severity': { $in: ['error', 'warn', 'info', 'log', 'debug', 'success'] },
		});
	});

	it('should include method filter when method is provided', () => {
		const queryParams: AppLogsProps = { method: 'app:construct' };
		const result = makeAppLogsQuery(queryParams);

		expect(result).to.deep.equal({
			method: 'app:construct',
		});
	});

	it('should include instanceId filter when instanceId is provided', () => {
		const queryParams: AppLogsProps = { instanceId: 'instance123' };
		const result = makeAppLogsQuery(queryParams);

		expect(result).to.deep.equal({
			instanceId: 'instance123',
		});
	});

	it('should include start date filter when startDate is provided', () => {
		const startDate = '2024-01-01T00:00:00.000Z';
		const queryParams: AppLogsProps = { startDate };
		const result = makeAppLogsQuery(queryParams);

		expect(result).to.deep.equal({
			_updatedAt: {
				$gte: new Date(startDate),
			},
		});
	});

	it('should include end date filter when endDate is provided', () => {
		const endDate = '2024-01-01T00:00:00.000Z';
		const queryParams: AppLogsProps = { endDate };
		const result = makeAppLogsQuery(queryParams);

		const expectedEndDate = new Date(endDate);

		expect(result).to.deep.equal({
			_updatedAt: {
				$lte: expectedEndDate,
			},
		});
	});

	it('should combine start and end date filters', () => {
		const startDate = '2024-01-01T00:00:00.000Z';
		const endDate = '2024-01-02T00:00:00.000Z';
		const queryParams: AppLogsProps = { startDate, endDate };
		const result = makeAppLogsQuery(queryParams);

		const expectedEndDate = new Date(endDate);

		expect(result).to.deep.equal({
			_updatedAt: {
				$gte: new Date(startDate),
				$lte: expectedEndDate,
			},
		});
	});

	it('should throw error when start date is after end date', () => {
		const startDate = '2024-01-02T00:00:00.000Z';
		const endDate = '2024-01-01T00:00:00.000Z';
		const queryParams: AppLogsProps = { startDate, endDate };

		expect(() => makeAppLogsQuery(queryParams)).to.throw('Invalid date range');
	});

	it('should combine all filters when all parameters are provided', () => {
		const queryParams: AppLogsProps = {
			logLevel: '1',
			method: 'app:construct',
			startDate: '2024-01-01T00:00:00.000Z',
			endDate: '2024-01-02T00:00:00.000Z',
			instanceId: 'instance123',
		};
		const result = makeAppLogsQuery(queryParams);

		const expectedEndDate = new Date(queryParams.endDate as string);

		expect(result).to.deep.equal({
			'entries.severity': { $in: ['error', 'warn', 'info', 'log'] },
			'method': 'app:construct',
			'_updatedAt': {
				$gte: new Date(queryParams.startDate as string),
				$lte: expectedEndDate,
			},
			'instanceId': 'instance123',
		});
	});
});
