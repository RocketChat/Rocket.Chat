import { escapeRegExp } from '@rocket.chat/string-helpers';
import { OmnichannelServiceLevelAgreements } from '@rocket.chat/models';
import type { IOmnichannelServiceLevelAgreements } from '@rocket.chat/core-typings';
import type { FindOptions } from 'mongodb';

type FindSLAParams = {
	text?: string;
	pagination: {
		offset: number;
		count: number;
		sort: FindOptions<IOmnichannelServiceLevelAgreements>['sort'];
	};
};

type FindSLAResult = {
	sla: IOmnichannelServiceLevelAgreements[];
	count: number;
	offset: number;
	total: number;
};

type FindSLAByIdParams = {
	slaId: string;
};

type FindSLAByIdResult = IOmnichannelServiceLevelAgreements | null;

export async function findSLA({ text, pagination: { offset, count, sort } }: FindSLAParams): Promise<FindSLAResult> {
	const query = {
		...(text && { $or: [{ name: new RegExp(escapeRegExp(text), 'i') }, { description: new RegExp(escapeRegExp(text), 'i') }] }),
	};

	const { cursor, totalCount } = await OmnichannelServiceLevelAgreements.findPaginated(query, {
		sort: sort || { name: 1 },
		skip: offset,
		limit: count,
	});

	const [sla, total] = await Promise.all([cursor.toArray(), totalCount]);

	return {
		sla,
		count: sla.length,
		offset,
		total,
	};
}

export async function findSLAById({ slaId }: FindSLAByIdParams): Promise<FindSLAByIdResult> {
	return OmnichannelServiceLevelAgreements.findOneById(slaId);
}
