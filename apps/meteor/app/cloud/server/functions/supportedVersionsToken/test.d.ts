import type { SignedSupportedVersions } from '@rocket.chat/server-cloud-communication';

declare module '*.versions' {
	export const supportedVersions: SignedSupportedVersions;
}
