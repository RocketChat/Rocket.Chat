import zlib from 'zlib';

import _ from 'underscore';

import { IServiceProviderOptions } from '../definition/IServiceProviderOptions';

let providerList: Array<IServiceProviderOptions> = [];
let debug = false;
let relayState: string | null = null;

const globalSettings = {
	generateUsername: false,
	nameOverwrite: false,
	mailOverwrite: false,
	immutableProperty: 'EMail',
	defaultUserRole: 'user',
	roleAttributeName: '',
	roleAttributeSync: false,
	userDataFieldMap: '{"username":"username", "email":"email", "cn": "name"}',
	usernameNormalize: 'None',
};

export class SAMLUtils {
	static get isDebugging(): boolean {
		return debug;
	}

	static get globalSettings(): Record<string, any> {
		return globalSettings;
	}

	static get serviceProviders(): Array<IServiceProviderOptions> {
		return providerList;
	}

	static get relayState(): string | null {
		return relayState;
	}

	static set relayState(value: string | null) {
		relayState = value;
	}

	static getServiceProviderOptions(providerName: string): IServiceProviderOptions | undefined {
		this.log(providerName);
		this.log(providerList);

		return _.find(providerList, (providerOptions) => providerOptions.provider === providerName);
	}

	static setServiceProvidersList(list: Array<IServiceProviderOptions>): void {
		providerList = list;
	}

	// TODO: Some of those should probably not be global
	static updateGlobalSettings(samlConfigs: Record<string, any>): void {
		debug = Boolean(samlConfigs.debug);

		globalSettings.generateUsername = Boolean(samlConfigs.generateUsername);
		globalSettings.nameOverwrite = Boolean(samlConfigs.nameOverwrite);
		globalSettings.mailOverwrite = Boolean(samlConfigs.mailOverwrite);
		globalSettings.roleAttributeSync = Boolean(samlConfigs.roleAttributeSync);

		if (samlConfigs.immutableProperty && typeof samlConfigs.immutableProperty === 'string') {
			globalSettings.immutableProperty = samlConfigs.immutableProperty;
		}

		if (samlConfigs.usernameNormalize && typeof samlConfigs.usernameNormalize === 'string') {
			globalSettings.usernameNormalize = samlConfigs.usernameNormalize;
		}

		if (samlConfigs.defaultUserRole && typeof samlConfigs.defaultUserRole === 'string') {
			globalSettings.defaultUserRole = samlConfigs.defaultUserRole;
		}

		if (samlConfigs.roleAttributeName && typeof samlConfigs.roleAttributeName === 'string') {
			globalSettings.roleAttributeName = samlConfigs.roleAttributeName;
		}

		if (samlConfigs.userDataFieldMap && typeof samlConfigs.userDataFieldMap === 'string') {
			globalSettings.userDataFieldMap = samlConfigs.userDataFieldMap;
		}
	}

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
		const lines = cert.match(/.{1,64}/g);
		if (!lines) {
			throw new Error('Invalid Certificate');
		}

		lines.splice(0, 0, '-----BEGIN CERTIFICATE-----');
		lines.push('-----END CERTIFICATE-----');

		return lines.join('\n');
	}

	static fillTemplateData(template: string, data: Record<string, string>): string {
		let newTemplate = template;

		for (const variable in data) {
			if (variable in data) {
				newTemplate = newTemplate.replace(`__${ variable }__`, data[variable]);
			}
		}

		return newTemplate;
	}

	static log(...args: Array<any>): void {
		if (debug) {
			console.log(...args);
		}
	}

	static inflateXml(base64Data: string, successCallback: (xml: string) => void, errorCallback: (err: object) => void): void {
		const buffer = new Buffer(base64Data, 'base64');
		zlib.inflateRaw(buffer, (err, decoded) => {
			if (err) {
				this.log(`Error while inflating. ${ err }`);
				return errorCallback(err);
			}

			const xmlString = this.convertArrayBufferToString(decoded);
			return successCallback(xmlString);
		});
	}

	static validateStatus(doc: Document): { success: boolean; message: string; statusCode: string } {
		let successStatus = false;
		let status = null;
		let messageText = '';

		const statusNodes = doc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:protocol', 'StatusCode');

		if (statusNodes.length) {
			const statusNode = statusNodes[0];
			const statusMessage = doc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:protocol', 'StatusMessage')[0];

			if (statusMessage && statusMessage.firstChild && statusMessage.firstChild.textContent) {
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
			statusCode: status || '',
		};
	}

	static normalizeCert(cert: string): string {
		return cert.replace('-----BEGIN CERTIFICATE-----', '').replace('-----END CERTIFICATE-----', '').trim();
	}

	static getUserDataMapping(): Record<string, any> {
		const { userDataFieldMap } = globalSettings;

		let map: Record<string, any>;

		try {
			map = JSON.parse(userDataFieldMap);
		} catch (e) {
			map = {};
		}

		let emailField = 'email';
		let usernameField = 'username';
		let nameField = 'cn';
		const newMapping = new Map();
		const regexes = new Map();

		const applyField = function(samlFieldName: string, targetFieldName: string | {field: string; regex: string}): void {
			if (typeof targetFieldName === 'object') {
				regexes.set(targetFieldName.field, targetFieldName.regex);
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

			// If it's neither of those, move it to the new object
			newMapping.set(samlFieldName, map[samlFieldName]);
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

	static getProfileValue(profile: Record<string, any>, samlFieldName: string, regex: string): any {
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

	static convertArrayBufferToString(buffer: ArrayBuffer, encoding = 'utf8'): string {
		return Buffer.from(buffer).toString(encoding);
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
