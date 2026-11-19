import { LDAP } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { insertUser } from './insertUser';
import type { InsertUserOptions } from './insertUser';
import { settings } from '../../settings';
import { isCustomOAuthServiceAllowed, processCustomOAuthUser } from '../auth-providers/custom-oauth/customOAuth';
import { callbacks } from '../callbacks';

export type ExternalServiceLoginResult = { type: string; userId: IUser['_id'] };

const servicesClaimingUsersByEmail = ['github', 'gitlab', 'google', 'apple'];

const claimUserWithSameEmail = async (serviceName: string, serviceData: Record<string, any>) => {
	if (!servicesClaimingUsersByEmail.includes(serviceName) && serviceData._OAuthCustom !== true) {
		return;
	}

	if (!serviceData.email) {
		return;
	}

	const user = await Users.findOneByEmailAddress(serviceData.email);
	if (!user || user.services?.[serviceName as keyof NonNullable<IUser['services']>]?.id === serviceData.id) {
		return;
	}

	const emailVerifiedByUser = user.emails?.some(({ address, verified }) => address === serviceData.email && verified === true);
	if (user.services?.password && !emailVerifiedByUser) {
		await Users.resetPasswordAndSetRequirePasswordChange(
			user._id,
			true,
			'This_email_has_already_been_used_and_has_not_been_verified__Please_change_your_password',
		);
	}

	await Users.setServiceId(user._id, serviceName, serviceData.id);
	await Users.setEmailVerified(user._id, serviceData.email);
};

const updateOrCreateServiceUser = async (
	serviceName: string,
	serviceData: Record<string, any>,
	options: InsertUserOptions,
): Promise<ExternalServiceLoginResult> => {
	if (serviceName === 'password' || serviceName === 'resume') {
		throw new Error(`Can't use updateOrCreateUserFromExternalService with internal service ${serviceName}`);
	}

	if (!Object.hasOwn(serviceData, 'id')) {
		throw new Error(`Service data for service ${serviceName} must include id`);
	}

	const user = await Users.findOneByServiceId(serviceName, serviceData.id, { projection: { _id: 1 } });
	if (user) {
		await Users.setServiceDataById(user._id, serviceName, serviceData);
		return { type: serviceName, userId: user._id };
	}

	const userId = await insertUser({ ...options }, { services: { [serviceName]: serviceData } });
	return { type: serviceName, userId };
};

export async function updateOrCreateUserFromExternalService(
	serviceName: string,
	serviceData: Record<string, any> = {},
	options: InsertUserOptions = {},
): Promise<ExternalServiceLoginResult | undefined> {
	await claimUserWithSameEmail(serviceName, serviceData);

	if (!isCustomOAuthServiceAllowed(serviceName)) {
		return undefined;
	}

	await processCustomOAuthUser(serviceName, serviceData);

	const result = await updateOrCreateServiceUser(serviceName, serviceData, options);

	const user = await Users.findOneById(result.userId);
	if (!user) {
		return undefined;
	}

	if (settings.get('LDAP_Update_Data_On_OAuth_Login') && user.username) {
		await LDAP.loginAuthenticatedUserRequest(user.username);
	}

	await callbacks.run('afterValidateNewOAuthUser', { identity: serviceData, serviceName, user });

	return result;
}
