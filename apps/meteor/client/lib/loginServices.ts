import type { LoginServiceConfiguration } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { capitalize } from '@rocket.chat/string-helpers';
import type { LoginService } from '@rocket.chat/ui-contexts';

import { sdk } from '../../app/utils/client/lib/SDKClient';

type LoginServicesEvents = {
	changed: undefined;
	loaded: LoginServiceConfiguration[];
};

type LoadState = 'loaded' | 'loading' | 'error' | 'none';

const maxRetries = 3;

class LoginServices extends Emitter<LoginServicesEvents> {
	private retries = 0;

	private services: LoginServiceConfiguration[] = [];

	private serviceButtons: LoginService[] = [];

	private state: LoadState = 'none';

	private config: Record<string, Partial<LoginService>> = {
		'apple': { title: 'Apple', icon: 'apple' },
		'facebook': { title: 'Facebook', icon: 'facebook' },
		'twitter': { title: 'Twitter', icon: 'twitter' },
		'google': { title: 'Google', icon: 'google' },
		'github': { title: 'Github', icon: 'github' },
		'github_enterprise': { title: 'Github Enterprise', icon: 'github' },
		'gitlab': { title: 'Gitlab', icon: 'gitlab' },
		'dolphin': { title: 'Dolphin', icon: 'dophin' },
		'drupal': { title: 'Drupal', icon: 'drupal' },
		'nextcloud': { title: 'Nextcloud', icon: 'nextcloud' },
		'tokenpass': { title: 'Tokenpass', icon: 'tokenpass' },
		'meteor-developer': { title: 'Meteor', icon: 'meteor' },
		'wordpress': { title: 'WordPress', icon: 'wordpress' },
		'linkedin': { title: 'Linkedin', icon: 'linkedin' },
	};

	private setServices(state: LoadState, services: LoginServiceConfiguration[]) {
		this.services = services;
		this.state = state;

		this.generateServiceButtons();

		if (state === 'loaded') {
			this.retries = 0;
			this.emit('loaded', services);
		}
	}

	private generateServiceButtons(): void {
		const filtered = this.services.filter((config) => !('showButton' in config) || config.showButton !== false) || [];
		const sorted = filtered.sort(({ service: service1 }, { service: service2 }) => service1.localeCompare(service2));
		this.serviceButtons = sorted.map((service) => {
			// Remove the appId attribute if present
			const { appId: _, ...serviceData } = {
				...service,
				appId: undefined,
			};

			// Get the hardcoded title and icon, or fallback to capitalizing the service name
			const serviceConfig = this.config[service.service] || {
				title: capitalize(service.service),
			};

			return {
				...serviceData,
				...serviceConfig,
			};
		});

		this.emit('changed');
	}

	public getLoginService(serviceName: string): LoginServiceConfiguration | undefined {
		if (!this.ready) {
			return;
		}

		return this.services.find(({ service }) => service === serviceName);
	}

	public get ready() {
		return this.state === 'loaded';
	}

	public getLoginServiceButtons(): LoginService[] {
		if (!this.ready) {
			if (this.state === 'none') {
				void this.loadServices();
			}
		}

		return this.serviceButtons;
	}

	public onLoad(callback: (services: LoginServiceConfiguration[]) => void) {
		if (this.ready) {
			return callback(this.services);
		}

		void this.loadServices();
		this.once('loaded', callback);
	}

	public async loadServices(): Promise<void> {
		if (this.state === 'error') {
			if (this.retries >= maxRetries) {
				return;
			}
			this.retries++;
		} else if (this.state !== 'none') {
			return;
		}

		try {
			this.state = 'loading';
			const { configurations } = await sdk.rest.get('/v1/service.configurations');

			this.setServices('loaded', configurations);
		} catch (e) {
			this.setServices('error', []);
			throw e;
		}
	}
}

export const loginServices = new LoginServices();
