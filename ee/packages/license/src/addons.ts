import type { LicenseManager } from './license';

export function getAddons(this: LicenseManager) {
	const license = this.getLicense();

	return license?.addOns || [];
}

export function getAddon(this: LicenseManager, addonId: string) {
	const license = this.getLicense();

	return license?.addOns?.find((addon) => addon.id === addonId);
}

export function hasValidAddon(this: LicenseManager, addonId: string) {
	const addon = getAddon.call(this, addonId);

	const now = new Date();

	return Boolean(addon?.expiresAt && now < new Date(addon.expiresAt));
}
