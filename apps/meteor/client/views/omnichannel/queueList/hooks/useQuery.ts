import type { ILivechatAgent, ILivechatDepartment } from '@rocket.chat/core-typings';
import { useMemo } from 'react';

type useQueryType = (
	debouncedParams: {
		servedBy: string;
		status: string;
		departmentId: ILivechatDepartment['_id'];
		itemsPerPage: number;
		current: number;
	},
	debouncedSort: [string, 'asc' | 'desc'],
) => {
	agentId?: ILivechatAgent['_id'];
	includeOfflineAgents?: boolean;
	departmentId?: ILivechatAgent['_id'];
	offset: number;
	count: number;
	sort: string;
};

const sortDir = (sortDir: string): number => (sortDir === 'asc' ? 1 : -1);

export const useQuery: useQueryType = ({ servedBy, status, departmentId, itemsPerPage, current }, [column, direction]) =>
	useMemo(() => {
		const query: {
			agentId?: string;
			includeOflineAgents?: boolean;
			departmentId?: string;
			sort: string;
			count: number;
			offset: number;
		} = {
			sort: JSON.stringify({
				[column]: sortDir(direction),
			}),
			count: itemsPerPage,
			offset: current,
		};

		if (status !== 'online') {
			query.includeOflineAgents = true;
		}
		if (servedBy) {
			query.agentId = servedBy;
		}
		if (departmentId) {
			query.departmentId = departmentId;
		}

		return query;
	}, [column, direction, itemsPerPage, current, status, servedBy, departmentId]);
