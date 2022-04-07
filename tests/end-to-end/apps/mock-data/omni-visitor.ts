import { IVisitor } from '@rocket.chat/apps-engine/definition/livechat';

import { createRandomEmail, createRandomPhoneNumber, createUniqueId } from './utils';

export type IVisitorWithPhoneNo = Omit<IVisitor, 'phone'> & { phone: Required<IVisitor['phone']> };
export type IVisitorWithEmail = Omit<IVisitor, 'visitorEmails'> & { visitorEmails: Required<IVisitor['visitorEmails']> };

export const generateVisitor = (
	type: 'visitorWithUsernameAndId' | 'visitorWithPhoneNoAndUsername' | 'visitorWithEmailAndUsername',
): IVisitor => {
	switch (type) {
		case 'visitorWithUsernameAndId': {
			const uniqueId = createUniqueId();
			return {
				id: uniqueId,
				token: uniqueId,
				username: `username-${uniqueId}`,
			} as IVisitor;
		}
		case 'visitorWithPhoneNoAndUsername': {
			const phoneNumber = createRandomPhoneNumber();
			return {
				token: createUniqueId(),
				phone: [{ phoneNumber }],
				username: phoneNumber,
			} as IVisitorWithPhoneNo;
		}
		case 'visitorWithEmailAndUsername': {
			const email = createRandomEmail();
			return {
				token: createUniqueId(),
				visitorEmails: [{ address: email }],
				username: email,
			} as IVisitorWithEmail;
		}
	}
};
