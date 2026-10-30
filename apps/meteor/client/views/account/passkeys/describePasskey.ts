import type { IPasskey, ISessionDevice } from '@rocket.chat/core-typings';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { TFunction } from 'i18next';

type PasskeyKind = 'built-in' | 'security-key' | 'phone';

const SECURITY_KEY_TRANSPORTS = ['usb', 'nfc', 'ble', 'smart-card'];

/** Where a passkey lives, as far as the browser that created it could tell. */
export const getPasskeyKind = ({
	authenticatorAttachment,
	transports = [],
}: Pick<IPasskey, 'authenticatorAttachment' | 'transports'>): PasskeyKind | undefined => {
	if (authenticatorAttachment === 'platform') {
		return 'built-in';
	}
	if (transports.some((transport) => SECURITY_KEY_TRANSPORTS.includes(transport))) {
		return 'security-key';
	}
	if (transports.includes('hybrid')) {
		return 'phone';
	}
	if (transports.includes('internal')) {
		return 'built-in';
	}
	return undefined;
};

export const passkeyKindIcons: Record<PasskeyKind | 'unknown', IconName> = {
	'built-in': 'fingerprint',
	'security-key': 'key',
	'phone': 'mobile',
	'unknown': 'key',
};

export const getPasskeyKindLabel = (t: TFunction, kind: PasskeyKind | undefined) => {
	switch (kind) {
		case 'built-in':
			return t('Passkey_kind_built_in');
		case 'security-key':
			return t('Passkey_kind_security_key');
		case 'phone':
			return t('Passkey_kind_phone');
		default:
			return t('Unknown');
	}
};

/** Names a client the way the passkey list shows it, e.g. "Chrome 130 on Windows 10". */
export const formatPasskeyClient = (t: TFunction, device: ISessionDevice | undefined) => {
	if (!device?.name) {
		return undefined;
	}

	const client = [device.name, device.version?.split('.')[0]].filter(Boolean).join(' ');
	const platform = [device.os?.name, device.os?.version].filter(Boolean).join(' ');

	return platform ? t('Passkey_client_on_platform', { client, platform }) : client;
};
