import zlib from 'zlib';

import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import array2string from 'arraybuffer-to-string';

import { Logger } from '../../../logger';
import { settings } from '../../../settings';

export const logger = new Logger('steffo:meteor-accounts-saml', {
	methods: {
		updated: {
			type: 'info',
		},
	},
});

export class SAMLUtils {
	static generateUniqueID(): string {
		const chars = 'abcdef0123456789';
		let uniqueID = 'id-';
		for (let i = 0; i < 20; i++) {
			uniqueID += chars.substr(Math.floor(Math.random() * 15), 1);
		}
		return uniqueID;
	}

	static generateInstant(): string {
		return new Date().toISOString();
	}

	static certToPEM(cert: string): string {
		cert = cert.match(/.{1,64}/g).join('\n');
		cert = `-----BEGIN CERTIFICATE-----\n${ cert }`;
		cert = `${ cert }\n-----END CERTIFICATE-----\n`;
		return cert;
	}

	static fillTemplateData(template: string, data: object): string {
		let newTemplate = template;

		for (const variable in data) {
			if (variable in data) {
				newTemplate = newTemplate.replace(`__${ variable }__`, data[variable]);
			}
		}

		return newTemplate;
	}

	static log(...args): void {
		if (Meteor.settings.debug) {
			logger.info(...args);
		}
	}

	static inflateXml(base64Data: object, successCallback: (xml: string) => void, errorCallback: (err: object) => void): void {
		const buffer = new Buffer(base64Data, 'base64');
		zlib.inflateRaw(buffer, (err, decoded) => {
			if (err) {
				SAMLUtils.log(`Error while inflating. ${ err }`);
				return errorCallback(err);
			}

			const xmlString = array2string(decoded);
			return successCallback(xmlString);
		});
	}

	static validateStatus(doc: object): Record<string, string> {
		let successStatus = false;
		let status = '';
		let messageText = '';
		const statusNodes = doc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:protocol', 'StatusCode');

		if (statusNodes.length) {
			const statusNode = statusNodes[0];
			const statusMessage = doc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:protocol', 'StatusMessage')[0];

			if (statusMessage) {
				messageText = statusMessage.firstChild.textContent;
			}

			status = statusNode.getAttribute('Value');

			if (status === 'urn:oasis:names:tc:SAML:2.0:status:Success') {
				successStatus = true;
			}
		}
		return {
			success: successStatus,
			message: messageText,
			statusCode: status,
		};
	}

	static normalizeCert(cert: string): string {
		return cert.replace('-----BEGIN CERTIFICATE-----', '').replace('-----END CERTIFICATE-----', '').trim();
	}

	static getUserDataMapping(): Record<string, any> {
		const { userDataFieldMap } = Accounts.saml.settings;

		let map;

		try {
			map = JSON.parse(userDataFieldMap);
		} catch (e) {
			map = {};
		}

		let emailField = 'email';
		let usernameField = 'username';
		let nameField = 'cn';
		const newMapping = {};
		const regexes = {};

		const applyField = function(samlFieldName: string, targetFieldName: string): void {
			if (typeof targetFieldName === 'object') {
				regexes[targetFieldName.field] = targetFieldName.regex;
				targetFieldName = targetFieldName.field;
			}

			if (targetFieldName === 'email') {
				emailField = samlFieldName;
				return;
			}

			if (targetFieldName === 'username') {
				usernameField = samlFieldName;
				return;
			}

			if (targetFieldName === 'name') {
				nameField = samlFieldName;
				return;
			}

			newMapping[samlFieldName] = map[samlFieldName];
		};

		for (const field in map) {
			if (!map.hasOwnProperty(field)) {
				continue;
			}

			const targetFieldName = map[field];

			if (Array.isArray(targetFieldName)) {
				for (const item of targetFieldName) {
					applyField(field, item);
				}
			} else {
				applyField(field, targetFieldName);
			}
		}

		return {
			emailField,
			usernameField,
			nameField,
			userDataFieldMap: newMapping,
			regexes,
		};
	}

	static getProfileValue(profile: object, samlFieldName: string, regex: string): any {
		const value = profile[samlFieldName];

		if (!regex) {
			return value;
		}

		if (!value || !value.match) {
			return;
		}

		const match = value.match(new RegExp(regex));
		if (!match || !match.length) {
			return;
		}

		if (match.length >= 2) {
			return match[1];
		}

		return match[0];
	}

	static findUser(username: string, emailRegex: RegExp): object {
		if (Accounts.saml.settings.immutableProperty === 'Username') {
			if (username) {
				return Meteor.users.findOne({
					username,
				});
			}

			return null;
		}

		return Meteor.users.findOne({
			'emails.address': emailRegex,
		});
	}

	static guessNameFromUsername(username: string): string {
		return username
			.replace(/\W/g, ' ')
			.replace(/\s(.)/g, (u) => u.toUpperCase())
			.replace(/^(.)/, (u) => u.toLowerCase())
			.replace(/^\w/, (u) => u.toUpperCase());
	}

	static overwriteData(user: object, fullName: string, eppnMatch: boolean, emailList: Array): void {
		// Overwrite fullname if needed
		if (Accounts.saml.settings.nameOverwrite === true) {
			Meteor.users.update({
				_id: user._id,
			}, {
				$set: {
					name: fullName,
				},
			});
		}

		// Overwrite mail if needed
		if (Accounts.saml.settings.mailOverwrite === true && eppnMatch === true) {
			Meteor.users.update({
				_id: user._id,
			}, {
				$set: {
					emails: emailList.map((email) => ({
						address: email,
						verified: settings.get('Accounts_Verify_Email_For_External_Accounts'),
					})),
				},
			});
		}
	}
}

export const defaultAuthnContextTemplate = `<samlp:RequestedAuthnContext xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" Comparison="__authnContextComparison__">
	<saml:AuthnContextClassRef xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">
		__authnContext__
	</saml:AuthnContextClassRef>
</samlp:RequestedAuthnContext>`;

export const defaultAuthRequestTemplate = `<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ID="__uniqueId__" Version="2.0" IssueInstant="__instant__" ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" AssertionConsumerServiceURL="__callbackUrl__" Destination="__entryPoint__">
	<saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">__issuer__</saml:Issuer>
	__identifierFormatTag__
	__authnContextTag__
</samlp:AuthnRequest>`;

export const defaultLogoutResponseTemplate = `<samlp:LogoutResponse xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ID="__uniqueId__" 'Version="2.0" IssueInstant="__instant__" Destination="__idpSLORedirectURL__">
	<saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">__issuer__</saml:Issuer>
	<samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>
</samlp:LogoutResponse>`;

export const defaultLogoutRequestTemplate = `<samlp:LogoutRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ID="__uniqueId__" Version="2.0" IssueInstant="__instant__" Destination="__idpSLORedirectURL__">
	<saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">__issuer__</saml:Issuer>
	<saml:NameID xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" NameQualifier="http://id.init8.net:8080/openam" SPNameQualifier="__issuer__" Format="__identifierFormat__">__nameID__</saml:NameID>
	<samlp:SessionIndex xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol">__sessionIndex__</samlp:SessionIndex>
</samlp:LogoutRequest>`;

export const defaultNameIDTemplate = '<samlp:NameIDPolicy xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" Format="__identifierFormat__" AllowCreate="true"></samlp:NameIDPolicy>';
export const defaultIdentifierFormat = 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress';
export const defaultAuthnContext = 'urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport';
