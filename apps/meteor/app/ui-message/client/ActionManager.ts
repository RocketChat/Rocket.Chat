import type { DistributiveOmit } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { Random } from '@rocket.chat/random';
import type { RouterContext, IActionManager } from '@rocket.chat/ui-contexts';
import type * as UiKit from '@rocket.chat/ui-kit';
import { t } from 'i18next';
import type { ContextType } from 'react';
import { lazy } from 'react';

import * as banners from '../../../client/lib/banners';
import { imperativeModal } from '../../../client/lib/imperativeModal';
import { dispatchToastMessage } from '../../../client/lib/toast';
import { exhaustiveCheck } from '../../../lib/utils/exhaustiveCheck';
import { sdk } from '../../utils/client/lib/SDKClient';
import { UiKitTriggerTimeoutError } from './UiKitTriggerTimeoutError';

const UiKitModal = lazy(() => import('../../../client/views/modal/uikit/UiKitModal'));

export class ActionManager implements IActionManager {
	protected static TRIGGER_TIMEOUT = 5000;

	protected static TRIGGER_TIMEOUT_ERROR = 'TRIGGER_TIMEOUT_ERROR';

	protected events = new Emitter<{ busy: { busy: boolean }; [viewId: string]: any }>();

	protected appIdByTriggerId = new Map<string, string | undefined>();

	protected viewInstances = new Map<
		string,
		{
			payload?: {
				view: UiKit.ContextualBarView;
			};
			close: () => void;
		}
	>();

	public constructor(protected router: ContextType<typeof RouterContext>) {}

	protected invalidateTriggerId(id: string) {
		const appId = this.appIdByTriggerId.get(id);
		this.appIdByTriggerId.delete(id);
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

	public notifyBusy() {
		this.events.emit('busy', { busy: true });
	}

	public notifyIdle() {
		this.events.emit('busy', { busy: false });
	}

	public generateTriggerId(appId: string | undefined) {
		const triggerId = Random.id();
		this.appIdByTriggerId.set(triggerId, appId);
		setTimeout(() => this.invalidateTriggerId(triggerId), ActionManager.TRIGGER_TIMEOUT);
		return triggerId;
	}

	public async emitInteraction(appId: string, userInteraction: DistributiveOmit<UiKit.UserInteraction, 'triggerId'>) {
		const triggerId = this.generateTriggerId(appId);

		return this.runWithTimeout(
			async () => {
				let interaction: UiKit.ServerInteraction | undefined;

				try {
					interaction = (await sdk.rest.post(`/apps/ui.interaction/${appId}`, {
						...userInteraction,
						triggerId,
					})) as UiKit.ServerInteraction;

					this.handleServerInteraction(interaction);
				} finally {
					switch (userInteraction.type) {
						case 'viewSubmit':
							if (!!interaction && !['errors', 'modal.update', 'contextual_bar.update'].includes(interaction.type))
								this.disposeView(userInteraction.viewId);
							break;

						case 'viewClosed':
							if (!!interaction && interaction.type !== 'errors') this.disposeView(userInteraction.payload.viewId);
							break;
					}
				}
			},
			{ triggerId, appId, ...('viewId' in userInteraction ? { viewId: userInteraction.viewId } : {}) },
		);
	}

	protected async runWithTimeout<T>(task: () => Promise<T>, details: { triggerId: string; appId: string; viewId?: string }) {
		this.notifyBusy();

		let timer: ReturnType<typeof setTimeout> | undefined;

		try {
			const taskPromise = task();
			const timeoutPromise = new Promise<T>((_, reject) => {
				timer = setTimeout(() => {
					reject(new UiKitTriggerTimeoutError('Timeout', details));
				}, ActionManager.TRIGGER_TIMEOUT);
			});

			return await Promise.race([taskPromise, timeoutPromise]);
		} catch (error) {
			if (error instanceof UiKitTriggerTimeoutError) {
				dispatchToastMessage({
					type: 'error',
					message: t('UIKit_Interaction_Timeout'),
				});
				if (details.viewId) {
					this.disposeView(details.viewId);
				}
			}
		} finally {
			if (timer) clearTimeout(timer);
			this.notifyIdle();
		}
	}

	public handleServerInteraction(interaction: UiKit.ServerInteraction): UiKit.ServerInteraction['type'] | undefined {
		const { triggerId } = interaction;

		const appId = this.invalidateTriggerId(triggerId);
		if (!appId) {
			return;
		}

		switch (interaction.type) {
			case 'errors': {
				const { type, triggerId, viewId, appId, errors } = interaction;
				this.events.emit(interaction.viewId, {
					type,
					triggerId,
					viewId,
					appId,
					errors,
				});
				break;
			}

			case 'modal.open': {
				const { view } = interaction;
				this.openModal(view);
				break;
			}

			case 'modal.update':
			case 'contextual_bar.update': {
				const { type, triggerId, appId, view } = interaction;
				this.events.emit(view.id, {
					type,
					triggerId,
					viewId: view.id,
					appId,
					view,
				});
				break;
			}

			case 'modal.close': {
				break;
			}

			case 'banner.open': {
				const { type, triggerId, ...view } = interaction;
				this.openBanner(view);
				break;
			}

			case 'banner.update': {
				const { type, triggerId, appId, view } = interaction;
				this.events.emit(view.viewId, {
					type,
					triggerId,
					viewId: view.viewId,
					appId,
					view,
				});
				break;
			}

			case 'banner.close': {
				const { viewId } = interaction;
				this.disposeView(viewId);
				break;
			}

			case 'contextual_bar.open': {
				const { view } = interaction;
				this.openContextualBar(view);
				break;
			}

			case 'contextual_bar.close': {
				const { view } = interaction;
				this.disposeView(view.id);
				break;
			}

			default:
				exhaustiveCheck(interaction);
		}

		return interaction.type;
	}

	public getInteractionPayloadByViewId(viewId: UiKit.ContextualBarView['id']) {
		if (!viewId) {
			throw new Error('No viewId provided when checking for `user interaction payload`');
		}

		return this.viewInstances.get(viewId)?.payload;
	}

	public openView(surface: 'modal', view: UiKit.ModalView): void;

	public openView(surface: 'banner', view: UiKit.BannerView): void;

	public openView(surface: 'contextual_bar', view: UiKit.ContextualBarView): void;

	public openView(surface: string, view: UiKit.View) {
		switch (surface) {
			case 'modal':
				this.openModal(view as UiKit.ModalView);
				break;

			case 'banner':
				this.openBanner(view as UiKit.BannerView);
				break;

			case 'contextual_bar':
				this.openContextualBar(view as UiKit.ContextualBarView);
				break;
		}
	}

	private openModal(view: UiKit.ModalView) {
		const instance = imperativeModal.open({
			component: UiKitModal,
			props: {
				key: view.id,
				initialView: view,
			},
		});

		this.viewInstances.set(view.id, {
			close: () => {
				instance.close();
				this.viewInstances.delete(view.id);
			},
		});
	}

	private openBanner(view: UiKit.BannerView) {
		banners.open(view);
		this.viewInstances.set(view.viewId, {
			close: () => {
				banners.closeById(view.viewId);
			},
		});
	}

	private openContextualBar(view: UiKit.ContextualBarView) {
		this.viewInstances.set(view.id, {
			payload: {
				view,
			},
			close: () => {
				this.viewInstances.delete(view.id);
			},
		});

		const routeName = this.router.getRouteName();
		const routeParams = this.router.getRouteParameters();

		if (!routeName) {
			return;
		}

		this.router.navigate({
			name: routeName,
			params: {
				...routeParams,
				tab: 'app',
				context: view.id,
			},
		});
	}

	public disposeView(viewId: UiKit.ModalView['id'] | UiKit.BannerView['viewId'] | UiKit.ContextualBarView['id']) {
		const instance = this.viewInstances.get(viewId);
		instance?.close?.();
		this.viewInstances.delete(viewId);
	}
}
