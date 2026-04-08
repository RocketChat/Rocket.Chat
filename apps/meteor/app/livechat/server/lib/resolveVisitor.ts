import type { IVisitorExternalIdentifier, ILivechatVisitor } from '@rocket.chat/core-typings';
import { LivechatVisitors } from '@rocket.chat/models';

type ResolveVisitorContactData = { phone: string } | { email: string };

type ResolveVisitorParams = {
	appId: string;
	externalId: Omit<IVisitorExternalIdentifier, 'appId'>;
	contactData?: ResolveVisitorContactData;
};

export async function resolveVisitor({ appId, externalId, contactData }: ResolveVisitorParams): Promise<ILivechatVisitor | null> {
	const visitorByExternalId = await LivechatVisitors.findOneByExternalId(externalId.entityId);
	if (visitorByExternalId) {
		return visitorByExternalId;
	}

	if (contactData && (('phone' in contactData && contactData.phone) || ('email' in contactData && contactData.email))) {
		return LivechatVisitors.findOneVisitorByPhoneOrEmailAndAddExternalId(contactData, appId, externalId);
	}

	return null;
}
