import type { Buffer } from 'buffer';

import type { IUpload } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { scan, scanBuffer, Verdict } from 'pompelmi';
import type { ScanOptions, VerdictValue } from 'pompelmi';

import { i18n } from '../../../../server/lib/i18n';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { settings } from '../../../settings/server';

type ScanMode = 'Local' | 'TCP' | 'Socket';

const getScanFailedError = (language: string) =>
	new Meteor.Error('error-file-upload-antivirus-scan-failed', i18n.t('FileUpload_Antivirus_Scan_Failed', { lng: language }));

const getScanOptions = (language: string): ScanOptions => {
	const mode = (settings.get<string>('FileUpload_Antivirus_ClamAV_Mode') || 'Local') as ScanMode;
	const timeout = settings.get<number>('FileUpload_Antivirus_ClamAV_Timeout');
	const timeoutOption = typeof timeout === 'number' && timeout > 0 ? { timeout } : {};

	switch (mode) {
		case 'TCP': {
			const host = settings.get<string>('FileUpload_Antivirus_ClamAV_Host') || '127.0.0.1';
			const port = settings.get<number>('FileUpload_Antivirus_ClamAV_Port') || 3310;
			return {
				host,
				port,
				...timeoutOption,
			};
		}

		case 'Socket': {
			const socket = settings.get<string>('FileUpload_Antivirus_ClamAV_Socket')?.trim();
			if (!socket) {
				throw getScanFailedError(language);
			}

			return {
				socket,
				...timeoutOption,
			};
		}

		case 'Local':
		default:
			return {};
	}
};

const scanContent = (content: Buffer | string, options: ScanOptions): Promise<VerdictValue> => {
	if (typeof content === 'string') {
		return scan(content, options);
	}

	return scanBuffer(content, options);
};

export const scanFileUploadWithAntivirus = async ({
	file,
	content,
	language,
}: {
	file: IUpload;
	content?: Buffer | string;
	language: string;
}): Promise<void> => {
	if (!settings.get<boolean>('FileUpload_Antivirus_Enabled') || !content) {
 		return;
 	}
		return;
	}

	const options = getScanOptions(language);
	let verdict: VerdictValue;

	try {
		verdict = await scanContent(content, options);
	} catch (err) {
		SystemLogger.warn({
			msg: 'File upload antivirus scan failed',
			fileId: file._id,
			fileName: file.name,
			rid: file.rid,
			userId: file.userId,
			err,
		});
		throw getScanFailedError(language);
	}

	if (verdict === Verdict.Clean) {
		return;
	}

	if (verdict === Verdict.Malicious) {
		throw new Meteor.Error('error-file-upload-malware-detected', i18n.t('FileUpload_Malware_Detected', { lng: language }));
	}

	SystemLogger.warn({
		msg: 'File upload antivirus scan returned an error verdict',
		fileId: file._id,
		fileName: file.name,
		rid: file.rid,
		userId: file.userId,
		verdict: String(verdict),
	});
	throw getScanFailedError(language);
};
