import { Emitter } from '@rocket.chat/emitter';
import type { ReactNode } from 'react';
import { lazy } from 'react';

const ConnectionStatusBar = lazy(() => import('../components/connectionStatus/ConnectionStatusBar'));
const BannerRegion = lazy(() => import('../views/banners/BannerRegion'));
const ModalRegion = lazy(() => import('@rocket.chat/ui-client').then(({ ModalRegion }) => ({ default: ModalRegion })));
const ActionManagerBusyState = lazy(() => import('../components/ActionManagerBusyState'));
const AppLayoutThemeWrapper = lazy(() => import('../components/AppLayoutThemeWrapper'));
const CloudAnnouncementsRegion = lazy(() => import('../views/cloud/CloudAnnouncementsRegion'));

class AppLayoutSubscription extends Emitter<{ update: void }> {
	private descriptor: ReactNode = null;

	getSnapshot = (): ReactNode => this.descriptor;

	subscribe = (onStoreChange: () => void): (() => void) => this.on('update', onStoreChange);

	setCurrentValue(descriptor: ReactNode): void {
		this.descriptor = descriptor;
		this.emit('update');
	}

	render(element: ReactNode): void {
		this.setCurrentValue(element);
	}

	/**
	 * `standalone` is a route that is a complete UI of its own — the conference window — rather than the
	 * workspace with something rendered inside it. Those omit the app-level chrome, so an admin announcement or
	 * an E2E password prompt doesn't appear over a call.
	 *
	 * Deliberately not called `embedded`: that already means Rocket.Chat rendered inside someone else's page
	 * (`layout=embedded`), which is still the workspace and still wants its banners. Embedded chats reach this
	 * through the ordinary room route and never pass this option.
	 */
	wrap(element: ReactNode, { standalone = false }: { standalone?: boolean } = {}): ReactNode {
		return (
			<AppLayoutThemeWrapper>
				<ConnectionStatusBar />
				<ActionManagerBusyState />
				{!standalone && <CloudAnnouncementsRegion />}
				{!standalone && <BannerRegion />}
				{element}
				<ModalRegion />
			</AppLayoutThemeWrapper>
		);
	}
}

export const appLayout = new AppLayoutSubscription();
