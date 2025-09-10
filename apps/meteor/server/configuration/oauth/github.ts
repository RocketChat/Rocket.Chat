import type { OAuthConfiguration } from '@rocket.chat/core-typings';
import { Accounts } from 'meteor/accounts-base';
import { OAuth } from 'meteor/oauth';
import { ServiceConfiguration } from 'meteor/service-configuration';

import { registerOAuth2Service } from './registerOAuth2Service';

export async function configureGithubOAuth(): Promise<void> {
	// http://developer.github.com/v3/#user-agent-required
	const meteorRelease = Meteor.release ? `/${Meteor.release}` : '';
	const userAgent = `Meteor${meteorRelease}`;

	const getAccessToken = async (query: Record<string, any>) => {
		const config = (await ServiceConfiguration.configurations.findOneAsync({
			service: 'github',
		})) as OAuthConfiguration | undefined;
		if (!config) throw new Accounts.ConfigError();

		let response;
		try {
			const content = new URLSearchParams({
				client_id: config.clientId as string,
				client_secret: config.secret,
				code: query.code,
				redirect_uri: OAuth._redirectUri('github', config as any),
			});
			const request = await OAuth._fetch(`https://github.com/login/oauth/access_token?${content.toString()}`, 'POST', {
				headers: {
					'Accept': 'application/json',
					'User-Agent': userAgent,
				},
			});
			response = await request.json();
		} catch (err: any) {
			throw Object.assign(new Error(`Failed to complete OAuth handshake with Github. ${err.message}`), { response: err.response });
		}
		if (response.error) {
			// if the http response was a json object with an error attribute
			throw new Error(`Failed to complete OAuth handshake with GitHub. ${response.error}`);
		} else {
			return response.access_token;
		}
	};

	const getIdentity = async (accessToken: string) => {
		try {
			const request = await OAuth._fetch('https://api.github.com/user', 'GET', {
				headers: {
					'Accept': 'application/json',
					'User-Agent': userAgent,
					'Authorization': `token ${accessToken}`,
				}, // http://developer.github.com/v3/#user-agent-required
			});
			return await request.json();
		} catch (err: any) {
			throw Object.assign(new Error(`Failed to fetch identity from Github. ${err.message}`), { response: err.response });
		}
	};

	const getEmails = async (accessToken: string): Promise<Record<string, any>[]> => {
		try {
			const request = await OAuth._fetch('https://api.github.com/user/emails', 'GET', {
				headers: {
					'User-Agent': userAgent,
					'Accept': 'application/json',
					'Authorization': `token ${accessToken}`,
				}, // http://developer.github.com/v3/#user-agent-required
			});
			return await request.json();
		} catch (err) {
			return [];
		}
	};

	return registerOAuth2Service('github', async (query: Record<string, any>) => {
		const accessToken = await getAccessToken(query);
		const identity = await getIdentity(accessToken);
		const emails = await getEmails(accessToken);
		const primaryEmail = emails.find((email) => email.primary);

		return {
			serviceData: {
				id: identity.id,
				accessToken: OAuth.sealSecret(accessToken),
				email: identity.email || primaryEmail?.email || '',
				username: identity.login,
				name: identity.name,
				avatar: identity.avatar_url,
				company: identity.company,
				blog: identity.blog,
				location: identity.location,
				bio: identity.bio,
				emails,
			},
			options: { profile: { name: identity.name } },
		};
	});
}
