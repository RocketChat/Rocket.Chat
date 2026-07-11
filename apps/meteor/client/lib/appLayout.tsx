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

	wrap(element: ReactNode): ReactNode {
		return (
			<AppLayoutThemeWrapper>
				<ConnectionStatusBar />
				<ActionManagerBusyState />
				<CloudAnnouncementsRegion />
				<BannerRegion />
				{element}
				<ModalRegion />
			</AppLayoutThemeWrapper>
		);
	}
}

export const appLayout = new AppLayoutSubscription();
