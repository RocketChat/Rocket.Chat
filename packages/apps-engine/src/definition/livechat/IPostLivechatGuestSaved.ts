import type { IHttp, IModify, IPersistence, IRead } from '../accessors';
import { AppMethod } from '../metadata';
import type { IVisitor } from './IVisitor';

/**
 * Handler called after the guest's info get saved.
 */
export interface IPostLivechatGuestSaved {
	/**
	 * Handler called *after* the guest's info get saved.
	 *
	 * @param context the visitor which was saved.
	 * @param read An accessor to the environment
	 * @param http An accessor to the outside world
	 * @param persis An accessor to the App's persistence
	 * @param modify An accessor to the modifier
	 */
	[AppMethod.EXECUTE_POST_LIVECHAT_GUEST_SAVED](
		context: IVisitor,
		read: IRead,
		http: IHttp,
		persis: IPersistence,
		modify: IModify,
	): Promise<void>;
}
