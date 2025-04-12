import { OmnichannelIntegration } from '@rocket.chat/core-services';
import type {
	ILivechatVisitor,
	IUpload,
	MessageAttachment,
	ServiceData,
	FileAttachmentProps,
	IOmnichannelRoomInfo,
} from '@rocket.chat/core-typings';
import { OmnichannelSourceType } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { LivechatVisitors, LivechatRooms, LivechatDepartment } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { Meteor } from 'meteor/meteor';

import { getFileExtension } from '../../../../../lib/utils/getFileExtension';
import { API } from '../../../../api/server';
import { FileUpload } from '../../../../file-upload/server';
import { checkUrlForSsrf } from '../../../../lib/server/functions/checkUrlForSsrf';
import { settings } from '../../../../settings/server';
import { setCustomField } from '../../../server/api/lib/customFields';
import { registerGuest } from '../../../server/lib/guests';
import type { ILivechatMessage } from '../../../server/lib/localTypes';
import { sendMessage } from '../../../server/lib/messages';
import { createRoom } from '../../../server/lib/rooms';

const logger = new Logger('SMS');

const getUploadFile = async (details: Omit<IUpload, '_id'>, fileUrl: string) => {
	const isSsrfSafe = await checkUrlForSsrf(fileUrl);
	if (!isSsrfSafe) {
		throw new Meteor.Error('error-invalid-url', 'Invalid URL');
	}

	const response = await fetch(fileUrl, { redirect: 'error' });

	const content = Buffer.from(await response.arrayBuffer());

	const contentSize = content.length;

	if (response.status !== 200 || contentSize === 0) {
		throw new Meteor.Error('error-invalid-file-uploaded', 'Invalid file uploaded');
	}

	const fileStore = FileUpload.getStore('Uploads');

	return fileStore.insert({ ...details, size: contentSize }, content);
};

const defineDepartment = async (idOrName?: string) => {
	if (!idOrName || idOrName === '') {
		return;
	}

	const department = await LivechatDepartment.findOneByIdOrName(idOrName, { projection: { _id: 1 } });
	return department?._id;
};

const defineVisitor = async (smsNumber: string, targetDepartment?: string) => {
	const visitor = await LivechatVisitors.findOneVisitorByPhone(smsNumber);
	let data: { token: string; department?: string } = {
		token: visitor?.token || Random.id(),
	};

	if (!visitor) {
		data = Object.assign(data, {
			username: smsNumber.replace(/[^0-9]/g, ''),
			phone: {
				number: smsNumber,
			},
		});
	}

	if (targetDepartment) {
		data.department = targetDepartment;
	}

	const livechatVisitor = await registerGuest(data);

	if (!livechatVisitor) {
		throw new Meteor.Error('error-invalid-visitor', 'Invalid visitor');
	}

	return livechatVisitor;
};

const normalizeLocationSharing = (payload: ServiceData) => {
	const { extra: { fromLatitude: latitude, fromLongitude: longitude } = {} } = payload;
	if (!latitude || !longitude) {
		return;
	}

	return {
		type: 'Point',
		coordinates: [parseFloat(longitude), parseFloat(latitude)],
	};
};

// @ts-expect-error - this is an special endpoint that requires the return to not be wrapped as regular returns
API.v1.addRoute('livechat/sms-incoming/:service', {
	async post() {
		const { service } = this.urlParams;
		if (!(await OmnichannelIntegration.isConfiguredSmsService(service))) {
			return API.v1.failure('Invalid service');
		}

		const smsDepartment = settings.get<string>('SMS_Default_Omnichannel_Department');
		const SMSService = await OmnichannelIntegration.getSmsService(service);

		if (!(await SMSService.validateRequest(this.request.clone()))) {
			return API.v1.failure('Invalid request');
		}

		const sms = SMSService.parse(this.bodyParams);
		const { department } = this.queryParams;
		let targetDepartment = await defineDepartment(department || smsDepartment);
		if (!targetDepartment) {
			targetDepartment = await defineDepartment(smsDepartment);
		}

		const visitor = await defineVisitor(sms.from, targetDepartment);
		if (!visitor) {
			return API.v1.success(SMSService.error(new Error('Invalid visitor')));
		}

		const roomInfo: IOmnichannelRoomInfo = {
			sms: {
				from: sms.to,
			},
			source: {
				type: OmnichannelSourceType.SMS,
				alias: service,
				destination: sms.to,
			},
		};

		const { token } = visitor;
		const room =
			(await LivechatRooms.findOneOpenByVisitorTokenAndDepartmentIdAndSource(token, targetDepartment, OmnichannelSourceType.SMS)) ??
			(await createRoom({
				visitor,
				roomInfo,
			}));
		const location = normalizeLocationSharing(sms);
		const rid = room?._id;

		let file: ILivechatMessage['file'];
		const attachments: (MessageAttachment | undefined)[] = [];

		const [media] = sms?.media || [];
		if (media) {
			const { url: smsUrl, contentType } = media;
			const details = {
				name: 'Upload File',
				type: contentType,
				rid,
				visitorToken: token,
			};

			try {
				const uploadedFile = await getUploadFile(details, smsUrl);
				file = { _id: uploadedFile._id, name: uploadedFile.name || 'file', type: uploadedFile.type };
				const fileUrl = FileUpload.getPath(`${file._id}/${encodeURI(file.name || 'file')}`);

				const fileType = file.type as string;

				if (/^image\/.+/.test(fileType)) {
					const attachment: FileAttachmentProps = {
						title: file.name,
						type: 'file',
						description: file.description,
						title_link: fileUrl,
						image_url: fileUrl,
						image_type: fileType,
						image_size: file.size,
					};

					if (file.identify?.size) {
						attachment.image_dimensions = file?.identify.size;
					}

					attachments.push(attachment);
				} else if (/^audio\/.+/.test(fileType)) {
					const attachment: FileAttachmentProps = {
						title: file.name,
						type: 'file',
						description: file.description,
						title_link: fileUrl,
						audio_url: fileUrl,
						audio_type: fileType,
						audio_size: file.size,
						title_link_download: true,
					};

					attachments.push(attachment);
				} else if (/^video\/.+/.test(fileType)) {
					const attachment: FileAttachmentProps = {
						title: file.name,
						type: 'file',
						description: file.description,
						title_link: fileUrl,
						video_url: fileUrl,
						video_type: fileType,
						video_size: file.size as number,
						title_link_download: true,
					};

					attachments.push(attachment);
				} else {
					const attachment = {
						title: file.name,
						type: 'file',
						description: file.description,
						format: getFileExtension(file.name),
						title_link: fileUrl,
						title_link_download: true,
						size: file.size as number,
					};

					attachments.push(attachment);
				}
			} catch (err) {
				logger.error({ msg: 'Attachment upload failed', err });
				const attachment = {
					title: 'Attachment upload failed',
					type: 'file',
					description: 'An attachment was received, but upload to server failed',
					fields: [
						{
							title: 'User upload failed',
							value: 'An attachment was received, but upload to server failed',
							short: true,
						},
					],
					color: 'yellow',
				};

				attachments.push(attachment);
			}
		}

		const messageToSend: {
			guest: ILivechatVisitor;
			message: ILivechatMessage;
			roomInfo: IOmnichannelRoomInfo;
		} = {
			guest: visitor,
			roomInfo,
			message: {
				_id: Random.id(),
				rid,
				token,
				msg: sms.body,
				...(location && { location }),
				...(attachments && { attachments: attachments.filter((a: any): a is MessageAttachment => !!a) }),
				...(file && { file }),
			},
		};

		try {
			await sendMessage(messageToSend);
			const msg = SMSService.response();
			setImmediate(async () => {
				if (sms.extra) {
					if (sms.extra.fromCountry) {
						await setCustomField(messageToSend.message.token, 'country', sms.extra.fromCountry);
					}
					if (sms.extra.fromState) {
						await setCustomField(messageToSend.message.token, 'state', sms.extra.fromState);
					}
					if (sms.extra.fromCity) {
						await setCustomField(messageToSend.message.token, 'city', sms.extra.fromCity);
					}
					if (sms.extra.fromZip) {
						await setCustomField(messageToSend.message.token, 'zip', sms.extra.fromZip);
					}
				}
			});

			return msg;
		} catch (e: any) {
			return SMSService.error(e);
		}
	},
});
