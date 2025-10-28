// Expects the following details:
// {
// 	body: '<table>',
// 	subject: 'Rocket.Chat, 17 Users, 24 Messages, 1 File, 799504 Minutes, in #random',
//  files: ['i3nc9l3mn']
// }
import { Uploads } from '@rocket.chat/models';

import { UploadFS } from '../../../../server/ufs';
import * as Mailer from '../../../mailer/server/api';
import { settings } from '../../../settings/server';

export const sendEmail = async (data: { files: string[]; subject: string; body: string }) => {
	const attachments = [];

	for await (const fileId of data.files) {
		const file = await Uploads.findOneById(fileId);
		if (file?.store === 'rocketchat_uploads' || file?.store === 'fileSystem') {
			const rs = await UploadFS.getStore(file.store).getReadStream(fileId, file);
			attachments.push({
				filename: file.name,
				streamSource: rs,
			});
		}
	}

	await Mailer.sendNoWrap({
		to: settings.get('Smarsh_Email'),
		from: settings.get('From_Email'),
		subject: data.subject,
		html: data.body,
	});
};
