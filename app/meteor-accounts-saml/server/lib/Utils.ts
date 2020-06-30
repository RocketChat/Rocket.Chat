import zlib from 'zlib';

import _ from 'underscore';

import { IServiceProviderOptions } from '../definition/IServiceProviderOptions';
import { ISAMLUser } from '../definition/ISAMLUser';
import { ISAMLGlobalSettings } from '../definition/ISAMLGlobalSettings';
import { IUserDataMap, IAttributeMapping } from '../definition/IAttributeMapping';
import { StatusCode } from './constants';

// @ToDo remove this ts-ignore someday
// @ts-ignore skip checking if Logger exists to avoid having to import the Logger class here (it would bring a lot of baggage with its dependencies, affecting the unit tests)
type NullableLogger = Logger | Null;

let providerList: Array<IServiceProviderOptions> = [];
let debug = false;
let relayState: string | null = null;
let logger: NullableLogger = null;

const globalSettings: ISAMLGlobalSettings = {
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
	public static get isDebugging(): boolean {
		return debug;
	}

	public static get globalSettings(): ISAMLGlobalSettings {
		return globalSettings;
	}

	public static get serviceProviders(): Array<IServiceProviderOptions> {
		return providerList;
	}

	public static get relayState(): string | null {
		return relayState;
	}

	public static set relayState(value: string | null) {
		relayState = value;
	}

	public static getServiceProviderOptions(providerName: string): IServiceProviderOptions | undefined {
		this.log(providerName);
		this.log(providerList);

		return _.find(providerList, (providerOptions) => providerOptions.provider === providerName);
	}

	public static setServiceProvidersList(list: Array<IServiceProviderOptions>): void {
		providerList = list;
	}

	public static setLoggerInstance(instance: NullableLogger): void {
		logger = instance;
	}

	// TODO: Some of those should probably not be global
	public static updateGlobalSettings(samlConfigs: Record<string, any>): void {
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

	public static generateUniqueID(): string {
		const chars = 'abcdef0123456789';
		let uniqueID = 'id-';
		for (let i = 0; i < 20; i++) {
			uniqueID += chars.substr(Math.floor(Math.random() * 15), 1);
		}
		return uniqueID;
	}

	public static generateInstant(): string {
		return new Date().toISOString();
	}

	public static certToPEM(cert: string): string {
		const lines = cert.match(/.{1,64}/g);
		if (!lines) {
			throw new Error('Invalid Certificate');
		}

		lines.splice(0, 0, '-----BEGIN CERTIFICATE-----');
		lines.push('-----END CERTIFICATE-----');

		return lines.join('\n');
	}

	public static fillTemplateData(template: string, data: Record<string, string>): string {
		let newTemplate = template;

		for (const variable in data) {
			if (variable in data) {
				const key = `__${ variable }__`;
				while (newTemplate.includes(key)) {
					newTemplate = newTemplate.replace(key, data[variable]);
				}
			}
		}

		return newTemplate;
	}

	public static log(...args: Array<any>): void {
		if (debug && logger) {
			logger.info(...args);
		}
	}

	public static error(...args: Array<any>): void {
		if (logger) {
			logger.error(...args);
		}
	}

	public static inflateXml(base64Data: string, successCallback: (xml: string) => void, errorCallback: (err: string | object | null) => void): void {
		const buffer = new Buffer(base64Data, 'base64');
		zlib.inflateRaw(buffer, (err, decoded) => {
			if (err) {
				this.log(`Error while inflating. ${ err }`);
				return errorCallback(err);
			}

			if (!decoded) {
				return errorCallback('Failed to extract request data');
			}

			const xmlString = this.convertArrayBufferToString(decoded);
			return successCallback(xmlString);
		});
	}

	public static validateStatus(doc: Document): { success: boolean; message: string; statusCode: string } {
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

			if (status === StatusCode.success) {
				successStatus = true;
			}
		}
		return {
			success: successStatus,
			message: messageText,
			statusCode: status || '',
		};
	}

	public static normalizeCert(cert: string): string {
		if (!cert) {
			return cert;
		}

		return cert.replace(/-+BEGIN CERTIFICATE-+\r?\n?/, '')
			.replace(/-+END CERTIFICATE-+\r?\n?/, '')
			.replace(/\r\n/g, '\n')
			.trim();
	}

	public static getUserDataMapping(): IUserDataMap {
		const { userDataFieldMap, immutableProperty } = globalSettings;

		let map: Record<string, any>;

		try {
			map = JSON.parse(userDataFieldMap);
		} catch (e) {
			SAMLUtils.log(userDataFieldMap);
			SAMLUtils.log(e);
			throw new Error('Failed to parse custom user field map');
		}

		const parsedMap: IUserDataMap = {
			customFields: new Map(),
			attributeList: new Set(),
			email: {
				fieldName: 'email',
			},
			username: {
				fieldName: 'username',
			},
			name: {
				fieldName: 'cn',
			},
			identifier: {
				type: '',
			},
		};

		let identifier = immutableProperty.toLowerCase();

		for (const spFieldName in map) {
			if (!map.hasOwnProperty(spFieldName)) {
				continue;
			}

			const attribute = map[spFieldName];
			if (typeof attribute !== 'string' && typeof attribute !== 'object') {
				throw new Error(`SAML User Map: Invalid configuration for ${ spFieldName } field.`);
			}

			if (spFieldName === '__identifier__') {
				if (typeof attribute !== 'string') {
					throw new Error('SAML User Map: Invalid identifier.');
				}

				identifier = attribute;
				continue;
			}


			let attributeMap: IAttributeMapping | null = null;

			// If it's a complex type, let's check what's in it
			if (typeof attribute === 'object') {
				// A fieldName is mandatory for complex fields. If it's missing, let's skip this one.
				if (!attribute.hasOwnProperty('fieldName') && !attribute.hasOwnProperty('fieldNames')) {
					continue;
				}

				const fieldName = attribute.fieldName || attribute.fieldNames;
				const { regex, template } = attribute;

				if (Array.isArray(fieldName)) {
					if (!fieldName.length) {
						throw new Error(`SAML User Map: Invalid configuration for ${ spFieldName } field.`);
					}

					for (const idpFieldName of fieldName) {
						parsedMap.attributeList.add(idpFieldName);
					}
				} else {
					parsedMap.attributeList.add(fieldName);
				}

				if (regex && typeof regex !== 'string') {
					throw new Error('SAML User Map: Invalid RegEx');
				}

				if (template && typeof template !== 'string') {
					throw new Error('SAML User Map: Invalid Template');
				}

				attributeMap = {
					fieldName,
					...regex && { regex },
					...template && { template },
				};
			} else if (typeof attribute === 'string') {
				attributeMap = {
					fieldName: attribute,
				};
				parsedMap.attributeList.add(attribute);
			}

			if (attributeMap) {
				if (spFieldName === 'email' || spFieldName === 'username' || spFieldName === 'name') {
					parsedMap[spFieldName] = attributeMap;
				} else {
					parsedMap.customFields.set(spFieldName, attributeMap);
				}
			}
		}

		if (identifier) {
			const defaultTypes = [
				'email',
				'username',
			];

			if (defaultTypes.includes(identifier)) {
				parsedMap.identifier.type = identifier;
			} else {
				parsedMap.identifier.type = 'custom';
				parsedMap.identifier.attribute = identifier;
				parsedMap.attributeList.add(identifier);
			}
		}

		return parsedMap;
	}

	public static getProfileValue(profile: Record<string, any>, mapping: IAttributeMapping): any {
		const values: Record<string, string> = {
			regex: '',
		};
		const fieldNames = this.ensureArray<string>(mapping.fieldName);

		let mainValue;
		for (const fieldName of fieldNames) {
			values[fieldName] = profile[fieldName];

			if (!mainValue) {
				mainValue = profile[fieldName];
			}
		}

		let shouldRunTemplate = false;
		if (typeof mapping.template === 'string') {
			// unless the regex result is used on the template, we process the template first
			if (mapping.template.includes('__regex__')) {
				shouldRunTemplate = true;
			} else {
				mainValue = this.fillTemplateData(mapping.template, values);
			}
		}

		if (mapping.regex && mainValue && mainValue.match) {
			let regexValue;
			const match = mainValue.match(new RegExp(mapping.regex));
			if (match && match.length) {
				if (match.length >= 2) {
					regexValue = match[1];
				} else {
					regexValue = match[0];
				}
			}

			if (regexValue) {
				values.regex = regexValue;
				if (!shouldRunTemplate) {
					mainValue = regexValue;
				}
			}
		}

		if (shouldRunTemplate && typeof mapping.template === 'string') {
			mainValue = this.fillTemplateData(mapping.template, values);
		}

		return mainValue;
	}

	public static convertArrayBufferToString(buffer: ArrayBuffer, encoding = 'utf8'): string {
		return Buffer.from(buffer).toString(encoding);
	}

	public static normalizeUsername(name: string): string {
		const { globalSettings } = this;

		switch (globalSettings.usernameNormalize) {
			case 'Lowercase':
				name = name.toLowerCase();
				break;
		}

		return name;
	}

	public static ensureArray<T>(param: T | Array<T>): Array<T> {
		const emptyArray: Array<T> = [];
		return emptyArray.concat(param);
	}

	public static mapProfileToUserObject(profile: Record<string, any>): ISAMLUser {
		const userDataMap = this.getUserDataMapping();
		SAMLUtils.log('parsed userDataMap', userDataMap);
		const { defaultUserRole = 'user', roleAttributeName } = this.globalSettings;

		if (userDataMap.identifier.type === 'custom') {
			if (!userDataMap.identifier.attribute) {
				throw new Error('SAML User Data Map: invalid Identifier configuration received.');
			}
			if (!profile[userDataMap.identifier.attribute]) {
				throw new Error(`SAML Profile did not have the expected identifier (${ userDataMap.identifier.attribute }).`);
			}
		}

		const attributeList = new Map();
		for (const attributeName of userDataMap.attributeList) {
			if (profile[attributeName] === undefined) {
				this.log(`SAML user profile is missing the attribute ${ attributeName }.`);
				continue;
			}
			attributeList.set(attributeName, profile[attributeName]);
		}

		const email = this.getProfileValue(profile, userDataMap.email);
		const profileUsername = this.getProfileValue(profile, userDataMap.username);
		const name = this.getProfileValue(profile, userDataMap.name);

		// Even if we're not using the email to identify the user, it is still mandatory because it's a mandatory information on Rocket.Chat
		if (!email) {
			throw new Error('SAML Profile did not contain an email address');
		}

		const userObject: ISAMLUser = {
			customFields: new Map(),
			samlLogin: {
				provider: this.relayState,
				idp: profile.issuer,
				idpSession: profile.sessionIndex,
				nameID: profile.nameID,
			},
			emailList: this.ensureArray<string>(email),
			fullName: name || profile.displayName || profile.username,
			roles: this.ensureArray<string>(defaultUserRole.split(',')),
			eppn: profile.eppn,
			attributeList,
			identifier: userDataMap.identifier,
		};

		if (profileUsername) {
			userObject.username = this.normalizeUsername(profileUsername);
		}

		if (roleAttributeName && profile[roleAttributeName]) {
			userObject.roles = this.ensureArray<string>((profile[roleAttributeName] || '').split(','));
		}

		if (profile.language) {
			userObject.language = profile.language;
		}

		if (profile.channels) {
			if (Array.isArray(profile.channels)) {
				userObject.channels = profile.channels;
			} else {
				userObject.channels = profile.channels.split(',');
			}
		}

		for (const [fieldName, customField] of userDataMap.customFields) {
			const value = this.getProfileValue(profile, customField);
			if (value) {
				userObject.customFields.set(fieldName, value);
			}
		}

		return userObject;
	}
}
