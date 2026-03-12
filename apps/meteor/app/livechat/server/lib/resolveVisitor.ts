import type { IVisitorExternalIdentifier, ILivechatVisitor } from '@rocket.chat/core-typings';
import { LivechatVisitors } from '@rocket.chat/models';

type ResolveVisitorParams = {
	source: string;
	externalId: IVisitorExternalIdentifier;
	phone?: string;
};

export async function resolveVisitor({ source, externalId, phone }: ResolveVisitorParams): Promise<ILivechatVisitor | null> {
	const visitorByExternalId = await LivechatVisitors.findOneByExternalId(source, externalId.userId);
	if (visitorByExternalId) {
		return visitorByExternalId;
	}

	if (phone) {
		const visitorByPhone = await LivechatVisitors.findOneVisitorByPhone(phone);
		if (visitorByPhone) {
			// Enrich existing visitor with external ID (progressive enrichment)
			await LivechatVisitors.addExternalId(visitorByPhone._id, source, externalId);
			return {
				...visitorByPhone,
				externalIds: {
					...(visitorByPhone.externalIds ?? {}),
					[source]: externalId,
				},
			};
		}
	}

	return null;
}
