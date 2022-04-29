/* eslint-disable @typescript-eslint/camelcase */
import { fetch } from 'meteor/fetch';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { OmnichannelSourceType, ILivechatVisitor, FileAttachmentProps } from '@rocket.chat/core-typings';

import { FileUpload } from '../../../../file-upload/server';
import { LivechatRooms, LivechatVisitors, LivechatDepartment } from '../../../../models/server';
import { API } from '../../../../api/server';
import { SMS } from '../../../../sms';
import { Livechat } from '../../../server/lib/Livechat';

type UploadedFile = {
	_id: string;
	name: string;
	type: string;
	description: string;
	size: number;
	identify?: { size: { width: number; height: number } };
};

type ICoordinatePoint = {
	type: 'Point';
	coordinates: [number, number];
};

const getUploadFile = async (
	details: { name: string; type: any; rid: any; visitorToken: any },
	fileUrl: RequestInfo,
): Promise<UploadedFile> => {
	const response = await fetch(fileUrl);

	const content = Buffer.from(await response.arrayBuffer());

	const contentSize = content.length;

	if (response.status !== 200 || contentSize === 0) {
		throw new Meteor.Error('error-invalid-file-uploaded', 'Invalid file uploaded');
	}

	const fileStore = FileUpload.getStore('Uploads');

	return fileStore.insertSync({ ...details, size: contentSize }, content);
};

const defineDepartment = (idOrName: string | null): string | undefined => {
	if (!idOrName || idOrName === '') {
		return;
	}

	const department = LivechatDepartment.findOneByIdOrName(idOrName);
	return department?._id;
};

const defineVisitor = (smsNumber: string, targetDepartment: any): ILivechatVisitor | null => {
	const visitor = LivechatVisitors.findOneVisitorByPhone(smsNumber) as ILivechatVisitor;
	let data = {
		token: visitor?.token || Random.id(),
		...(targetDepartment && { department: targetDepartment }),
	};

	if (!visitor) {
		data = Object.assign(data, {
			username: smsNumber.replace(/[^0-9]/g, ''),
			phone: {
				number: smsNumber,
			},
		});
	}

	const id = Livechat.registerGuest(data);
	return LivechatVisitors.findOneById(id);
};

const normalizeLocationSharing = (payload: { extra?: { fromLatitude?: string; fromLongitude?: string } }): ICoordinatePoint | undefined => {
	const { extra: { fromLatitude: latitude, fromLongitude: longitude } = {} } = payload;
	if (!latitude || !longitude) {
		return;
	}

	return {
		type: 'Point',
		coordinates: [parseFloat(longitude), parseFloat(latitude)],
	};
};

API.v1.addRoute('livechat/sms-incoming/:service', {
	async post() {
		const SMSService = SMS.getService(this.urlParams.service);
		const sms = SMSService.parse(this.bodyParams);
		const { department } = this.queryParams;
		let targetDepartment = defineDepartment(department || SMS.department);
		if (!targetDepartment) {
			targetDepartment = defineDepartment(SMS.department);
		}

		const visitor = defineVisitor(sms.from, targetDepartment);
		if (!visitor) {
			throw new Error('Cannot fetch/create visitor with provided params');
		}

		const { token } = visitor;
		const room = LivechatRooms.findOneOpenByVisitorTokenAndDepartmentId(token, targetDepartment);
		const roomExists = !!room;
		const location = normalizeLocationSharing(sms);
		const rid = room?._id || Random.id();

		const sendMessage: any = {
			guest: visitor,
			roomInfo: {
				sms: {
					from: sms.to,
				},
				source: {
					type: OmnichannelSourceType.SMS,
					alias: this.urlParams.service,
				},
			},
		};

		// create an empty room first place, so attachments have a place to live
		if (!roomExists) {
			await Livechat.getRoom(visitor, { rid, token, msg: '' }, sendMessage.roomInfo, undefined);
		}

		let file;
		let attachments;

		// TODO: refactor all this into a better function, probably reusing code from "sendFileMessage"
		const [media] = sms.media;
		if (media) {
			const { url: smsUrl, contentType } = media;
			const details = {
				name: 'Upload File',
				type: contentType,
				rid,
				visitorToken: token,
			};

			let attachment: FileAttachmentProps;
			try {
				const uploadedFile = await getUploadFile(details, smsUrl);
				file = {
					_id: uploadedFile._id,
					name: uploadedFile.name,
					type: uploadedFile.type,
					description: uploadedFile.description,
					size: uploadedFile.size,
					identify: uploadedFile.identify,
				};
				const fileUrl = FileUpload.getPath(`${file._id}/${encodeURI(file.name)}`);

				if (/^image\/.+/.test(file.type)) {
					attachment = {
						title: file.name,
						type: 'file',
						description: file.description,
						title_link: fileUrl,
						image_url: fileUrl,
						image_type: file.type,
						image_size: file.size,
						image_dimensions: file.identify != null ? file.identify.size : undefined,
					};
					attachments = [attachment];
				} else if (/^audio\/.+/.test(file.type)) {
					attachment = {
						title: file.name,
						type: 'file',
						description: file.description,
						title_link: fileUrl,
						audio_url: fileUrl,
						audio_type: file.type,
						audio_size: file.size,
						title_link_download: true,
					};
					attachments = [attachment];
				} else if (/^video\/.+/.test(file.type)) {
					attachment = {
						title: file.name,
						type: 'file',
						description: file.description,
						title_link: fileUrl,
						video_url: fileUrl,
						video_type: file.type,
						video_size: file.size,
						title_link_download: true,
					};
					attachments = [attachment];
				} else {
					// @ts-expect-error
					attachment = {
						title: file.name,
						type: 'file',
						description: file.description,
						title_link: fileUrl,
						title_link_download: true,
					};
					attachments = [attachment];
				}
			} catch (e) {
				Livechat.logger.error(`Attachment upload failed: ${(e as Error).message}`);
				attachments = [
					{
						fields: [
							{
								title: 'User upload failed',
								value: 'An attachment was received, but upload to server failed',
								short: true,
							},
						],
						color: 'yellow',
					},
				];
			}
		}

		sendMessage.message = {
			_id: Random.id(),
			rid,
			token,
			msg: sms.body,
			...(location && { location }),
			...(attachments && { attachments }),
			...(file && { file }),
		};

		try {
			const msg = SMSService.response.call(this, await Livechat.sendMessage(sendMessage));
			Meteor.defer(() => {
				if (sms.extra) {
					if (sms.extra.fromCountry) {
						Meteor.call('livechat:setCustomField', sendMessage.message.token, 'country', sms.extra.fromCountry);
					}
					if (sms.extra.fromState) {
						Meteor.call('livechat:setCustomField', sendMessage.message.token, 'state', sms.extra.fromState);
					}
					if (sms.extra.fromCity) {
						Meteor.call('livechat:setCustomField', sendMessage.message.token, 'city', sms.extra.fromCity);
					}
				}
			});

			return msg;
		} catch (e) {
			return SMSService.error.call(this, e);
		}
	},
});
