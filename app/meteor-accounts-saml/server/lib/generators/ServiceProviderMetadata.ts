import { Meteor } from 'meteor/meteor';
import xmlbuilder from 'xmlbuilder';

import { defaultIdentifierFormat } from '../Utils';
import { IServiceProviderOptions } from '../../definition/IServiceProviderOptions';

/*
	The metadata will be available at the following url:
	[rocketchat-url]/_saml/metadata/[provider-name]
*/

export class ServiceProviderMetadata {
	static generate(serviceProviderOptions: IServiceProviderOptions): string {
		const data = this.getData(serviceProviderOptions);

		const metadata: Record<string, any> = {
			EntityDescriptor: {
				'@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
				'@xsi:schemaLocation': 'urn:oasis:names:tc:SAML:2.0:metadata https://docs.oasis-open.org/security/saml/v2.0/saml-schema-metadata-2.0.xsd',
				'@xmlns': 'urn:oasis:names:tc:SAML:2.0:metadata',
				'@xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#',
				'@entityID': data.issuer,
				SPSSODescriptor: {
					'@protocolSupportEnumeration': 'urn:oasis:names:tc:SAML:2.0:protocol',
				},
			},
		};

		if (data.privateKey) {
			if (!data.decryptionCert) {
				throw new Error(
					'Missing decryptionCert while generating metadata for decrypting service provider');
			}

			metadata.EntityDescriptor.SPSSODescriptor.KeyDescriptor = {
				'ds:KeyInfo': {
					'ds:X509Data': {
						'ds:X509Certificate': {
							'#text': data.decryptionCert,
						},
					},
				},
				EncryptionMethod: [
					// this should be the set that the xmlenc library supports
					{
						'@Algorithm': 'http://www.w3.org/2001/04/xmlenc#aes256-cbc',
					},
					{
						'@Algorithm': 'http://www.w3.org/2001/04/xmlenc#aes128-cbc',
					},
					{
						'@Algorithm': 'http://www.w3.org/2001/04/xmlenc#tripledes-cbc',
					},
				],
			};
		}

		metadata.EntityDescriptor.SPSSODescriptor.SingleLogoutService = {
			'@Binding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
			'@Location': `${ Meteor.absoluteUrl() }_saml/logout/${ serviceProviderOptions.provider }/`,
			'@ResponseLocation': `${ Meteor.absoluteUrl() }_saml/logout/${ serviceProviderOptions.provider }/`,
		};
		metadata.EntityDescriptor.SPSSODescriptor.NameIDFormat = data.identifierFormat;
		metadata.EntityDescriptor.SPSSODescriptor.AssertionConsumerService = {
			'@index': '1',
			'@isDefault': 'true',
			'@Binding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
			'@Location': data.callbackUrl,
		};

		return xmlbuilder.create(metadata).end({
			pretty: true,
			indent: '  ',
			newline: '\n',
		});
	}

	static getData(serviceProviderOptions: IServiceProviderOptions): Record<string, any> {
		let decryptionCert = serviceProviderOptions.privateCert;
		if (decryptionCert) {
			decryptionCert = decryptionCert.replace(/-+BEGIN CERTIFICATE-+\r?\n?/, '');
			decryptionCert = decryptionCert.replace(/-+END CERTIFICATE-+\r?\n?/, '');
			decryptionCert = decryptionCert.replace(/\r\n/g, '\n');
		}

		if (!serviceProviderOptions.callbackUrl) {
			throw new Error('Unable to generate service provider metadata when callbackUrl option is not set');
		}

		return {
			issuer: serviceProviderOptions.issuer,
			privateKey: serviceProviderOptions.privateKey,
			decryptionCert,
			identifierFormat: serviceProviderOptions.identifierFormat || defaultIdentifierFormat,
			callbackUrl: serviceProviderOptions.callbackUrl,
		};
	}
}
