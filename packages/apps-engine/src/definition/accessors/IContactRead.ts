import type { ILivechatContact } from '../livechat';

/**
 * Reads the Livechat contacts behind the workspace's visitors.
 *
 * It needs the `contact.read` permission.
 */
export interface IContactRead {
	getById(contactId: ILivechatContact['_id']): Promise<ILivechatContact | null>;
}
