import crypto from 'node:crypto';

import { License } from '@rocket.chat/license';

import { showErrorBox } from '../../../../server/lib/logger/showBox';

export function enforceFipsLicense(): void {
	if (!crypto.getFips()) {
		return;
	}

	if (License.hasModule('fips')) {
		return;
	}

	const reason = !License.encryptedLicense
		? 'No license was found in this workspace'
		: (!License.hasValidLicense() && 'The license applied to this workspace is invalid or expired') ||
			"The license applied to this workspace does not include the 'fips' module";

	showErrorBox(
		'FIPS LICENSE ERROR',
		[
			`${reason}.`,
			'',
			'This server is running in FIPS mode, which requires a valid license',
			"including the 'fips' module.",
			'',
			'Provide your license through the ROCKETCHAT_LICENSE environment variable,',
			'or contact Rocket.Chat to obtain one: https://www.rocket.chat/sales-contact',
		].join('\n'),
	);

	process.exit(1);
}
