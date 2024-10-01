import { LicenseAddon } from '@rocket.chat/core-typings';
import type { LicenseManager } from './license';
import { addonEvent } from './events/emitter';

export function getAddons(this: LicenseManager) {
	const license = this.getLicense();

	return license?.addOns || [];
}

export function getAddon(this: LicenseManager, addonId: string) {
	const license = this.getLicense();

	return license?.addOns?.find((addon) => addon.id === addonId);
}

export function hasValidAddon(this: LicenseManager, addonId: string): boolean {
	const addon = getAddon.call(this, addonId);

	return !!addon && validateAddon(addon);
}

export function replaceAddons(this: LicenseManager, addons: LicenseAddon[]) {
	for (const addon of addons) {
		const valid = validateAddon(addon);
		const storedAddon = this.addons.get(addon.id);

		let isNew = true;

		if (storedAddon) {
			// Metadata for us to know not to delete it later
			(storedAddon as any).visited = true;
			isNew = false;
		} else {
			// Metadata for us to know not to delete it later
			(addon as any).visited = true;
			this.addons.set(addon.id, addon);
		}

		addonEvent.call(this, { addon, valid, isNew });
	}

	for (const addon of this.addons.values()) {
		// In case we've seen it previously, just remove the metadata
		if ((addon as any).visited) {
			delete (addon as any).visited;
			continue;
		}

		this.addons.delete(addon.id);

		addonEvent.call(this, { addon, valid: false, isNew: false });
	}
}

function validateAddon(addon: LicenseAddon): boolean {
	const now = new Date();

	return Boolean(addon?.expiresAt && now < new Date(addon.expiresAt));
}
