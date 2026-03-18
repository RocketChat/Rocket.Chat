import type { IVisitorExternalIdentifier, ILivechatVisitor } from '@rocket.chat/core-typings';
import { LivechatVisitors } from '@rocket.chat/models';

type ResolveVisitorContactData = { phone: string } | { email: string };

type ResolveVisitorParams = {
	source: string;
	externalId: IVisitorExternalIdentifier;
	contactData?: ResolveVisitorContactData;
};

export async function resolveVisitor({ source, externalId, contactData }: ResolveVisitorParams): Promise<ILivechatVisitor | null> {
	const visitorByExternalId = await LivechatVisitors.findOneByExternalId(source, externalId.userId);
	if (visitorByExternalId) {
		return visitorByExternalId;
	}

	if (contactData && (('phone' in contactData && contactData.phone) || ('email' in contactData && contactData.email))) {
		return LivechatVisitors.findOneVisitorByPhoneOrEmailAndAddExternalId(contactData, source, externalId);
	}

	return null;
}
