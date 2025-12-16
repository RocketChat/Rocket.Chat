import crypto from 'crypto';

import type { BrowserContextOptions, Page } from '@playwright/test';

import { BASE_URL } from '../config/constants';

export type IUserState = {
	data: {
		_id: string;
		username: string;
		loginToken: string;
		loginExpire: Date;
		hashedToken: string;
		e2e?: {
			private_key: string;
			public_key: string;
		};
		e2ePassword?: string;
	};
	state: Exclude<BrowserContextOptions['storageState'], string | undefined>;
};

const e2eeData: Record<string, { server: IUserState['data']['e2e']; client: { private_key: string } }> = {
	userE2EE: {
		server: {
			private_key:
				'{"$binary":"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"}',
			public_key:
				'{"alg":"RSA-OAEP-256","e":"AQAB","ext":true,"key_ops":["encrypt"],"kty":"RSA","n":"qVLMv2Iwm_Hyhlnh4etNlHEiCXBzJWbqMwOZ6pz_JuZY2HiqbLmSfBtpvwBKZvcmP92BqLl-qZuLV_bJD_11UBS3gR6ykgU-RsTz1L-V8vA2QZEyULP4DqkMcRCV_7WE_sn_ScePgKszx1284gnngct_1Tv37zB6Ifz7gb1THRwAqOGcE2htea4yQEhyX8ZAl_-95DTWLbXqEAuofqDpXMcQo487VezBWIaDdfw2VX0qi6kM-pt03Gx8uMniyAjhK1G8Dro3wgAtz4PNIwOsdXEvWTSyoXLVMsIuZeO9OGdJKXnZFtVEMzXLyQTD1LjXlsM_TF09fbkN41Tz12ojmQ"}',
		},
		client: {
			private_key:
				'{"alg":"RSA-OAEP-256","d":"IpABtkEzPenNwQng105CKD5NndKj1msi_CXMibzhQk37rbg3xXi9w3KPC8th5JGnb5rl6AxxI-rZrytzUD3C8AVCjes3tSG33BdA1FkFITFSSeD6_ck2pbtxDDVAARHK431VDHjdPHz11Ui3kQZHiNGCtwKGMf9Zts1eg1WjfQnQw2ta4-38mwHpq-4Cm_F1brNTTAu5XlHMws4-TDlYhY3nFU2XvoiR2RPDbMddtvXpDZIVo9s7h3jcS4JxHeJd7mWfwcR_Wf0ArRJIhckgPQtTAAjADNpw_HAdERfJyOAJUnxtHkv4uTu_k23qDpPGEi8euFpQ_1UD8B_Z1Rxylw","dp":"OS3zu_VYJZmOXl1dRXxYGP69MR4YQ3TFJ58HFIxvebD060byGHL-mwf0R6-a1hBkHfSeUI9iPipEcjQeevasPqm5CG8eYMvGU2vhsoq1gfY79rsoKjnThCO3XiUbNeM-G9MRKMRa3ooQ8fUVHyEWKFo1ajoFbVHxZuqTAOgrYT8","dq":"yXtWRU1vM5imQJhIZBt5BO1Rfn-koHTvTM3c5QDdPLyNoGTKTyeoT3P9clN6qevJKTyJJTWiwuz8ZECSksh_m9STCY1ry2HqlF2EKdCZnTQzhoJvb6d7547Witc9eh2rBjsILSxVBadLzOFe8opkkQkdkM_gN_Rr3TtXEAo1vn8","e":"AQAB","ext":true,"key_ops":["decrypt"],"kty":"RSA","n":"qVLMv2Iwm_Hyhlnh4etNlHEiCXBzJWbqMwOZ6pz_JuZY2HiqbLmSfBtpvwBKZvcmP92BqLl-qZuLV_bJD_11UBS3gR6ykgU-RsTz1L-V8vA2QZEyULP4DqkMcRCV_7WE_sn_ScePgKszx1284gnngct_1Tv37zB6Ifz7gb1THRwAqOGcE2htea4yQEhyX8ZAl_-95DTWLbXqEAuofqDpXMcQo487VezBWIaDdfw2VX0qi6kM-pt03Gx8uMniyAjhK1G8Dro3wgAtz4PNIwOsdXEvWTSyoXLVMsIuZeO9OGdJKXnZFtVEMzXLyQTD1LjXlsM_TF09fbkN41Tz12ojmQ","p":"0GJaXeKlxgcz6pX0DdwtWG38x9vN2wfLrN3F8N_0stzyPMjMpLGXOdGq1k1V6FROYvLHZsqdCpziwJ3a1PQaGUg2lO-KeBghlbDk4xfYbzSSPhVdwvUT27dysd3-_TsBvNpVCqCLb9Wgl8f0jrrRmRTSztYSLw3ckL939OJoe0M","q":"0AOMQqdGlz0Tm81uqpzCuQcQLMj-IhmPIMuuTnIU55KCmEwmlf0mkgesj-EEBsC1h6ScC5fvznGNvSGqVQAP5ANNZxGiB73q-2YgH3FpuEeHekufl260E_9tgIuqjtCv-eT_cLUhnRNyuP2ZiqRZsBWLuaQYkTubyGRi6izoofM","qi":"FXbIXivKdh0VBgMtLe5f1OjzyrSW_IfIvz8ZM66F4tUTxnNKk5vSb_q2NPyIOVYbdonuVguX-0VO54Ct16k8VdpQSMmUxGbyQAtIck2IzEzpfbRJgn06wiAI3j8q1nRFhrzhfrpJWVyuTiXBgaeOLWBz8fBpjDU7rptmcoU3tZ4"}',
		},
	},
};

function generateContext(username: string): IUserState {
	const date = new Date();
	date.setFullYear(date.getFullYear() + 1);

	const token = {
		token: crypto.createHash('sha256').update(username).digest('base64'),
		when: date,
	};

	const hashedToken = crypto.createHash('sha256').update(token.token).digest('base64');

	return {
		data: {
			_id: username,
			username,
			loginToken: token.token,
			loginExpire: token.when,
			hashedToken,
			...(e2eeData[username] && {
				e2e: e2eeData[username]?.server,
				e2ePassword: 'minus mobile dexter forest elvis',
			}),
		},
		state: {
			cookies: [
				{
					sameSite: 'Lax',
					name: 'rc_uid',
					value: username,
					domain: 'localhost',
					path: '/',
					expires: -1,
					httpOnly: false,
					secure: false,
				},
				{
					sameSite: 'Lax',
					name: 'rc_token',
					value: token.token,
					domain: 'localhost',
					path: '/',
					expires: -1,
					httpOnly: false,
					secure: false,
				},
			],
			origins: [
				{
					origin: BASE_URL,
					localStorage: [
						{
							name: 'userLanguage',
							value: 'en-US',
						},
						{
							name: 'Meteor.loginToken',
							value: token.token,
						},
						{
							name: 'Meteor.loginTokenExpires',
							value: token.when.toISOString(),
						},
						{
							name: 'Meteor.userId',
							value: username,
						},
						...(e2eeData[username]
							? [
									{
										name: 'private_key',
										value: e2eeData[username]?.client.private_key,
									},
								]
							: []),
					],
				},
			],
		},
	};
}

export const Users = {
	user1: generateContext('user1'),
	user2: generateContext('user2'),
	user3: generateContext('user3'),
	userNotAllowedByApp: generateContext('userNotAllowedByApp'),
	userE2EE: generateContext('userE2EE'),
	samluser1: generateContext('samluser1'),
	samluser2: generateContext('samluser2'),
	samluser4: generateContext('samluser4'),
	samluser5: generateContext('samluser5'),
	samluser6: generateContext('samluser6'),
	samluser7: generateContext('samluser7'),
	samlusernoname: generateContext('custom_saml_username'),
	samlusernoname2: generateContext('custom_saml_username2'),
	userForSamlMerge: generateContext('user_for_saml_merge'),
	userForSamlMerge2: generateContext('user_for_saml_merge2'),
	admin: generateContext('rocketchat.internal.admin.test'),
};

export async function storeState(page: Page, user: IUserState) {
	user.state.origins = (await page.context().storageState()).origins;
}

export async function restoreState(page: Page, user: IUserState, options: { except?: string[] } = {}) {
	let ls = user.state.origins[0].localStorage;
	if (options.except?.length) {
		ls = ls.filter(({ name }) => !options.except?.includes(name));
	}

	await page.evaluate((items) => {
		items.forEach(({ name, value }) => {
			window.localStorage.setItem(name, value);
		});
	}, ls);

	await page.waitForTimeout(2000); // Wait for the login to be completed
}
