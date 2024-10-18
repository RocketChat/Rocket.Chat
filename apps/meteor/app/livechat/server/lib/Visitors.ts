import { UserStatus, type ILivechatVisitor } from '@rocket.chat/core-typings';
import { LivechatDepartment, LivechatVisitors } from '@rocket.chat/models';

import { settings } from '../../../settings/server';
import { validateEmail } from './Helper';
import { Livechat, type RegisterGuestType } from './LivechatTyped';

export const Visitors = {
	async registerGuest({
		id,
		token,
		name,
		phone,
		email,
		department,
		username,
		connectionData,
		status = UserStatus.ONLINE,
		source,
	}: RegisterGuestType): Promise<ILivechatVisitor | null> {
		check(token, String);
		check(id, Match.Maybe(String));

		Livechat.logger.debug(`New incoming conversation: id: ${id} | token: ${token}`);

		const visitorDataToUpdate: Partial<ILivechatVisitor> & { userAgent?: string; ip?: string; host?: string } = {
			token,
			status,
			source,
			...(phone?.number ? { phone: [{ phoneNumber: phone.number }] } : {}),
			...(name ? { name } : {}),
		};

		if (email) {
			const visitorEmail = email.trim().toLowerCase();
			validateEmail(visitorEmail);
			visitorDataToUpdate.visitorEmails = [{ address: visitorEmail }];
		}

		const livechatVisitor = await LivechatVisitors.getVisitorByToken(token, { projection: { _id: 1 } });

		if (livechatVisitor?.department !== department && department) {
			Livechat.logger.debug(`Attempt to find a department with id/name ${department}`);
			const dep = await LivechatDepartment.findOneByIdOrName(department, { projection: { _id: 1 } });
			if (!dep) {
				Livechat.logger.debug(`Invalid department provided: ${department}`);
				throw new Meteor.Error('error-invalid-department', 'The provided department is invalid');
			}
			Livechat.logger.debug(`Assigning visitor ${token} to department ${dep._id}`);
			visitorDataToUpdate.department = dep._id;
		}

		visitorDataToUpdate.token = livechatVisitor?.token || token;

		let existingUser = null;

		if (livechatVisitor) {
			Livechat.logger.debug('Found matching user by token');
			visitorDataToUpdate._id = livechatVisitor._id;
		} else if (phone?.number && (existingUser = await LivechatVisitors.findOneVisitorByPhone(phone.number))) {
			Livechat.logger.debug('Found matching user by phone number');
			visitorDataToUpdate._id = existingUser._id;
			// Don't change token when matching by phone number, use current visitor token
			visitorDataToUpdate.token = existingUser.token;
		} else if (email && (existingUser = await LivechatVisitors.findOneGuestByEmailAddress(email))) {
			Livechat.logger.debug('Found matching user by email');
			visitorDataToUpdate._id = existingUser._id;
		} else if (!livechatVisitor) {
			Livechat.logger.debug(`No matches found. Attempting to create new user with token ${token}`);

			visitorDataToUpdate._id = id || undefined;
			visitorDataToUpdate.username = username || (await LivechatVisitors.getNextVisitorUsername());
			visitorDataToUpdate.status = status;
			visitorDataToUpdate.ts = new Date();
			visitorDataToUpdate.source = source;

			if (settings.get('Livechat_Allow_collect_and_store_HTTP_header_informations') && Livechat.isValidObject(connectionData)) {
				Livechat.logger.debug(`Saving connection data for visitor ${token}`);
				const { httpHeaders, clientAddress } = connectionData;
				if (Livechat.isValidObject(httpHeaders)) {
					visitorDataToUpdate.userAgent = httpHeaders['user-agent'];
					visitorDataToUpdate.ip = httpHeaders['x-real-ip'] || httpHeaders['x-forwarded-for'] || clientAddress;
					visitorDataToUpdate.host = httpHeaders?.host;
				}
			}
		}

		const upsertedLivechatVisitor = await LivechatVisitors.updateOneByIdOrToken(visitorDataToUpdate, {
			upsert: true,
			returnDocument: 'after',
		});

		if (!upsertedLivechatVisitor.value) {
			Livechat.logger.debug(`No visitor found after upsert`);
			return null;
		}

		return upsertedLivechatVisitor.value;
	},
};
