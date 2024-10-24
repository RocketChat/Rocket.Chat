import type { AtLeast, ILivechatVisitor } from '@rocket.chat/core-typings';
import { LivechatContacts } from '@rocket.chat/models';
import { wrapExceptions } from '@rocket.chat/tools';

import { validateEmail } from '../Helper';
import type { RegisterGuestType } from '../LivechatTyped';
import { ContactMerger, type FieldAndValue } from './ContactMerger';

export async function registerGuestData(
	{ name, phone, email, username }: Pick<RegisterGuestType, 'name' | 'phone' | 'email' | 'username'>,
	visitor: AtLeast<ILivechatVisitor, '_id'>,
): Promise<void> {
	// If a visitor was updated who already had a contact, load up that contact and update that information as well
	const contact = await LivechatContacts.findOneByVisitorId(visitor._id);
	if (!contact) {
		return;
	}

	const validatedEmail =
		email &&
		wrapExceptions(() => {
			const trimmedEmail = email.trim().toLowerCase();
			validateEmail(trimmedEmail);
			return trimmedEmail;
		}).suppress();

	const fields = [
		{ type: 'name', value: name },
		{ type: 'phone', value: phone?.number },
		{ type: 'email', value: validatedEmail },
		{ type: 'username', value: username || visitor.username },
	].filter((field) => Boolean(field.value)) as FieldAndValue[];

	if (!fields.length) {
		return;
	}

	await ContactMerger.mergeFieldsIntoContact(fields, contact, contact.unknown ? 'overwrite' : 'conflict');
}
