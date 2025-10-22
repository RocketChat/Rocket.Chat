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
	userE2EE2: {
		server: {
			private_key:
				'{"$binary":"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"}',
			public_key:
				'{"alg":"RSA-OAEP-256","e":"AQAB","ext":true,"key_ops":["encrypt"],"kty":"RSA","n":"rBVz-Qg3zWnW0y3WyrVNmLs6_6nCL4ny79QLySNQ-cXFnh-tHixFu9CDZi3jeKvRteI9JPtVNilma8QA0vPQbe5dpql89SQnha5Jg_q6W-YoBvDjnVFgUvCEqNbXTrH0wvDrrROf7Ge8BnEAVRK8eE-UosQwkisK5adyuRgntn00mFqYPAHEu5tdZarmluy30C8licn_o8n0FUBR5VPBSr1opczx7Pfc-ZUccy09r42ZzJN9PJigzKO7Oo7LJTZV3I55hAWDfl7IGUc0E2oVUuEfxaJFBhEm8ilJDpy8esgc5vySHgtLjVOBG8P5YlIVvZBCD9YnUOetaJocHA9u0Q"}',
		},
		client: {
			private_key:
				'{"alg":"RSA-OAEP-256","d":"NIrmWrr-Itu2qstbwpAiLci5RnfkYVSLF1xU7ui4IFOZN-MvHj_hWOvdOxU219EKmrEF_2U4Su3QJoZ1w_OLCA3YjXtBuq373U7uhnxHa6j2PsxNi2rd8OUcdFsI6a_fbqhWJYYQ9gNkf0kAk3lBj7Cozxv9Qpwe2ylKF6b-9TJ7DbYNcratPNdyYgaGQo2Z1POGJFLTGqJzjFutujzE-A25saeq_4BUfwk_3jZ4KzVLlukbHZpQT4lR88bYPhVEbp3xu6tZjhxR1RtiQB5QxpLHx_7avoR-HTir_6Oqn_6BdCMUiG174dZwoPu3ZWpxMFXYKNQccV5t62hKJkjpGw","dp":"O-djJY4GzmL9FTyafPBKeucc6-oQYiW9CzIzQQVKT9TxT9qZVGWbCQcZtqpB1UVK4aN2XdX2y3r8xPXw6-tB1-IPo7hE-BaFJcQNBja5TaXR56jR4jESXidxONvZX2juJD5jUpW2FoX1Bf-08XtoMqeKRPSem5QjarkL9-Jyg7k","dq":"ptx1PQZujFsfvAEu_KkWsSs3nJQQrzx_nS9oZncFYQahjxDsUVKPwx-nJleLjmkhyuRfj0BIua6NlXk9jpLPdLSmCNFnp6dVfjaLu-BYB6l_HVfwxSKmM_d0DAQ2KZMDMZdfJfUPY6gKAmkS-TSgbiOc96VuoYMQ-qkxDXDGjys","e":"AQAB","ext":true,"key_ops":["decrypt"],"kty":"RSA","n":"rBVz-Qg3zWnW0y3WyrVNmLs6_6nCL4ny79QLySNQ-cXFnh-tHixFu9CDZi3jeKvRteI9JPtVNilma8QA0vPQbe5dpql89SQnha5Jg_q6W-YoBvDjnVFgUvCEqNbXTrH0wvDrrROf7Ge8BnEAVRK8eE-UosQwkisK5adyuRgntn00mFqYPAHEu5tdZarmluy30C8licn_o8n0FUBR5VPBSr1opczx7Pfc-ZUccy09r42ZzJN9PJigzKO7Oo7LJTZV3I55hAWDfl7IGUc0E2oVUuEfxaJFBhEm8ilJDpy8esgc5vySHgtLjVOBG8P5YlIVvZBCD9YnUOetaJocHA9u0Q","p":"8x7-fjYY7ZM80SoJ6ry1ijP_CItzanD9ajSby2AfybTPT6VWaqT-I6wVhm-dkysv3DVk6U2gxqOcUDKSAdeBuvD2pJ6r2yYRUP95OA2wjIKf44HU7TaLXtTusWJjvNF6qQFTJoIikGShQngGXDVrtWvxvWX2PMspIyNtZyYFzhc","q":"tTMcSWZMhr7KV1Ofs2jRUcuVHxZQMYhq1Xz-LgEyDuxBtHroxuMfMGJi_OKbl0ezbRr50WpSaRn-xR0mb0Psxhyk5T6H-QoAvqEFPY_0kGHUMZd7M17f6-aQ37u7fkFWFRwfU9UlYvBTL0NYY37EJX-HCUUn9T_3CBTaCtdo41c","qi":"2bkud0ILcjyAHv7elCqLPTTZOJXyQhXTBvB5fLoCUI-gxh3CpinTOcwnT28K-M0XWbKJGDXgdOWtNd6JBxhGecf1vRGOILY5WvHnO0ry-2_0AMEzE7iE_NqK3UbNSUF1PmnV07KgrVxfAjEddW3s4BQldTqqKHS001NSfOACzfQ"}',
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
	userE2EE2: generateContext('userE2EE2'),
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
