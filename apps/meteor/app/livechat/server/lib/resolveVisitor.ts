import type { IVisitorExternalIdentifier, ILivechatVisitor } from '@rocket.chat/core-typings';
import { LivechatVisitors } from '@rocket.chat/models';

type ResolveVisitorParams = {
	externalId: IVisitorExternalIdentifier;
	phone?: string;
};

export async function resolveVisitor({ externalId, phone }: ResolveVisitorParams): Promise<ILivechatVisitor | null> {
	const visitorByExternalId = await LivechatVisitors.findOneByExternalId(externalId.source, externalId.userId);
	if (visitorByExternalId) {
		return visitorByExternalId;
	}

	if (phone) {
		const visitorByPhone = await LivechatVisitors.findOneVisitorByPhone(phone);
		if (visitorByPhone) {
			// Enrich existing visitor with external ID (progressive enrichment)
			await LivechatVisitors.addExternalId(visitorByPhone._id, externalId);
			return {
				...visitorByPhone,
				externalIds: [...(visitorByPhone.externalIds || []), externalId],
			};
		}
	}

	return null;
}
