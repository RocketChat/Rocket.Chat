import type { DistributiveOmit, UiKit } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { Random } from '@rocket.chat/random';
import type { ActionManagerContext } from '@rocket.chat/ui-contexts';
import type { ContextType } from 'react';
import { lazy } from 'react';

import * as banners from '../../../client/lib/banners';
import { imperativeModal } from '../../../client/lib/imperativeModal';
import { router } from '../../../client/providers/RouterProvider';
import { sdk } from '../../utils/client/lib/SDKClient';
import { UiKitTriggerTimeoutError } from './UiKitTriggerTimeoutError';

const UiKitModal = lazy(() => import('../../../client/views/modal/uikit/UiKitModal'));

type ActionManagerType = Exclude<ContextType<typeof ActionManagerContext>, undefined>;

export class ActionManager implements ActionManagerType {
	protected static TRIGGER_TIMEOUT = 5000;

	protected static TRIGGER_TIMEOUT_ERROR = 'TRIGGER_TIMEOUT_ERROR';

	protected events = new Emitter<{ busy: { busy: boolean }; [viewId: string]: any }>();

	protected triggersId = new Map<string, string | undefined>();

	protected viewInstances = new Map<string, { payload?: any; close: () => void }>();

	protected invalidateTriggerId(id: string) {
		const appId = this.triggersId.get(id);
		this.triggersId.delete(id);
		return appId;
	}

	public on(viewId: string, listener: (data: any) => void): void;

	public on(eventName: 'busy', listener: ({ busy }: { busy: boolean }) => void): void;

	public on(eventName: string, listener: (data: any) => void) {
		return this.events.on(eventName, listener);
	}

	public off(viewId: string, listener: (data: any) => any): void;

	public off(eventName: 'busy', listener: ({ busy }: { busy: boolean }) => void): void;

	public off(eventName: string, listener: (data: any) => void) {
		return this.events.off(eventName, listener);
	}

	public generateTriggerId(appId: string | undefined) {
		const triggerId = Random.id();
		this.triggersId.set(triggerId, appId);
		setTimeout(() => this.invalidateTriggerId(triggerId), ActionManager.TRIGGER_TIMEOUT);
		return triggerId;
	}

	public async emitInteraction(appId: string, userInteraction: DistributiveOmit<UiKit.UserInteraction, 'triggerId'>) {
		this.events.emit('busy', { busy: true });

		const triggerId = this.generateTriggerId(appId);

		let timeout: ReturnType<typeof setTimeout> | undefined;

		try {
			return new Promise((resolve, reject) => {
				timeout = setTimeout(() => reject(new UiKitTriggerTimeoutError('Timeout', { triggerId, appId })), ActionManager.TRIGGER_TIMEOUT);

				sdk.rest
					.post(`/apps/ui.interaction/${appId}`, {
						...userInteraction,
						triggerId,
					})
					.then(({ type, ...data }) => {
						resolve(this.handlePayloadUserInteraction(type, data));
					}, reject);
			});
		} finally {
			if (timeout) clearTimeout(timeout);
			this.events.emit('busy', { busy: false });
		}
	}

	public handlePayloadUserInteraction = (type: any, { triggerId, ...data }: any) => {
		if (!this.triggersId.has(triggerId)) {
			return;
		}
		const appId = this.invalidateTriggerId(triggerId);
		if (!appId) {
			return;
		}

		const { view } = data;
		let { viewId } = data;

		if (view?.id) {
			viewId = view.id;
		}

		if (!viewId) {
			return;
		}

		if (type === 'errors') {
			this.events.emit(viewId, {
				type,
				triggerId,
				viewId,
				appId,
				...data,
			});
			return 'errors';
		}

		if (['banner.update', 'modal.update', 'contextual_bar.update'].includes(type)) {
			this.events.emit(viewId, {
				type,
				triggerId,
				viewId,
				appId,
				...data,
			});
			return type;
		}

		if (['modal.open'].includes(type)) {
			const instance = imperativeModal.open({
				component: UiKitModal,
				props: {
					triggerId,
					viewId,
					appId,
					...data,
				},
			});

			this.viewInstances.set(viewId, {
				close: () => {
					instance.close();
					this.viewInstances.delete(viewId);
				},
			});

			return 'modal.open';
		}

		if (['contextual_bar.open'].includes(type)) {
			this.viewInstances.set(viewId, {
				payload: {
					type,
					triggerId,
					appId,
					viewId,
					...data,
				},
				close: () => {
					this.viewInstances.delete(viewId);
				},
			});

			router.navigate({
				name: router.getRouteName()!,
				params: {
					...router.getRouteParameters(),
					tab: 'app',
					context: viewId,
				},
			});

			return 'contextual_bar.open';
		}

		if (['banner.open'].includes(type)) {
			banners.open(data);
			this.viewInstances.set(viewId, {
				close: () => {
					banners.closeById(viewId);
				},
			});
			return 'banner.open';
		}

		if (['banner.close'].includes(type)) {
			const instance = this.viewInstances.get(viewId);

			if (instance) {
				instance.close();
			}
			return 'banner.close';
		}

		if (['contextual_bar.close'].includes(type)) {
			const instance = this.viewInstances.get(viewId);

			if (instance) {
				instance.close();
			}
			return 'contextual_bar.close';
		}

		return 'modal.close';
	};

	public getUserInteractionPayloadByViewId = (viewId: any) => {
		if (!viewId) {
			throw new Error('No viewId provided when checking for `user interaction payload`');
		}

		const instance = this.viewInstances.get(viewId);

		if (!instance) {
			return {};
		}

		return instance.payload;
	};

	public disposeView(viewId: UiKit.View['viewId']) {
		const instance = this.viewInstances.get(viewId);
		instance?.close?.();
		this.viewInstances.delete(viewId);
	}
}

/** @deprecated consumer should use the context instead */
export const actionManager = new ActionManager();
