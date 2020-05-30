// Expects the following details:
// {
// 	body: '<table>',
// 	subject: 'Rocket.Chat, 17 Users, 24 Messages, 1 File, 799504 Minutes, in #random',
//  files: ['i3nc9l3mn']
// }
import _ from 'underscore';
import { UploadFS } from 'meteor/jalik:ufs';

import * as Mailer from '../../mailer';
import { Uploads } from '../../../app/models';
import { settings } from '../../../app/settings';
import { smarsh } from '../lib/rocketchat';

smarsh.sendEmail = (data) => {
	const attachments = [];

	_.each(data.files, (fileId) => {
		const file = Uploads.findOneById(fileId);
		if (file.store === 'rocketchat_uploads' || file.store === 'fileSystem') {
			const rs = UploadFS.getStore(file.store).getReadStream(fileId, file);
			attachments.push({
				filename: file.name,
				streamSource: rs,
			});
		}
	});


	Mailer.sendNoWrap({
		to: settings.get('Smarsh_Email'),
		from: settings.get('From_Email'),
		subject: data.subject,
		html: data.body,
		attachments,
	});
};
