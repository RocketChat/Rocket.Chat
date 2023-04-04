import xmldom from '@xmldom/xmldom';
import xmlenc from 'xml-encryption';
import xmlCrypto from 'xml-crypto';

import { SAMLUtils } from '../Utils';
import { StatusCode } from '../constants';
import type { IServiceProviderOptions } from '../../definition/IServiceProviderOptions';
import type { IResponseValidateCallback } from '../../definition/callbacks';
import type { ISAMLAssertion } from '../../definition/ISAMLAssertion';

type XmlParent = Element | Document;

export class ResponseParser {
	serviceProviderOptions: IServiceProviderOptions;

	constructor(serviceProviderOptions: IServiceProviderOptions) {
		this.serviceProviderOptions = serviceProviderOptions;
	}

	public validate(xml: string, callback: IResponseValidateCallback): void {
		// We currently use RelayState to save SAML provider
		SAMLUtils.log(`Validating response with relay state: ${xml}`);

		const doc = new xmldom.DOMParser().parseFromString(xml, 'text/xml');
		if (!doc) {
			return callback('No Doc Found');
		}

		const allResponses = doc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:protocol', 'Response');
		if (allResponses.length === 0) {
			return this._checkLogoutResponse(doc, callback);
		}

		if (allResponses.length !== 1) {
			return callback(new Error('Too many SAML responses'), null, false);
		}
		const response = allResponses[0];
		SAMLUtils.log('Got response');

		SAMLUtils.log('Verify status');
		const statusValidateObj = SAMLUtils.validateStatus(doc);
		if (!statusValidateObj.success) {
			if (!statusValidateObj.statusCode) {
				return callback(new Error('Missing StatusCode'), null, false);
			}

			if (statusValidateObj.statusCode === StatusCode.responder && statusValidateObj.message) {
				return callback(new Error(statusValidateObj.message), null, false);
			}

			return callback(new Error(`Status is: ${statusValidateObj.statusCode}`), null, false);
		}
		SAMLUtils.log('Status ok');

		let assertion: XmlParent;
		let assertionData: ISAMLAssertion;
		let issuer;

		try {
			assertionData = this.getAssertion(response, xml);
			assertion = assertionData.assertion;

			this.verifySignatures(response, assertionData, xml);
		} catch (e) {
			return callback(e instanceof Error ? e : String(e), null, false);
		}

		const profile: Record<string, any> = {};

		if (response.hasAttribute('InResponseTo')) {
			profile.inResponseToId = response.getAttribute('InResponseTo');
		}

		try {
			issuer = this.getIssuer(assertion);
		} catch (e) {
			return callback(e instanceof Error ? e : String(e), null, false);
		}

		if (issuer) {
			profile.issuer = issuer.textContent;
		}

		const subject = this.getSubject(assertion);
		if (subject) {
			const nameID = subject.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'NameID')[0];
			if (nameID) {
				profile.nameID = nameID.textContent;

				if (nameID.hasAttribute('Format')) {
					profile.nameIDFormat = nameID.getAttribute('Format');
				}
			}

			try {
				this.validateSubjectConditions(subject);
			} catch (e) {
				return callback(e instanceof Error ? e : String(e), null, false);
			}
		}

		try {
			this.validateAssertionConditions(assertion);
		} catch (e) {
			return callback(e instanceof Error ? e : String(e), null, false);
		}

		const authnStatement = assertion.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'AuthnStatement')[0];

		if (authnStatement) {
			if (authnStatement.hasAttribute('SessionIndex')) {
				profile.sessionIndex = authnStatement.getAttribute('SessionIndex');
				SAMLUtils.log(`Session Index: ${profile.sessionIndex}`);
			} else {
				SAMLUtils.log('No Session Index Found');
			}
		} else {
			SAMLUtils.log('No AuthN Statement found');
		}

		const attributeStatement = assertion.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'AttributeStatement')[0];
		if (attributeStatement) {
			this.mapAttributes(attributeStatement, profile);
		} else {
			SAMLUtils.log('No Attribute Statement found in SAML response.');
		}

		if (!profile.email && profile.nameID && profile.nameIDFormat && profile.nameIDFormat.indexOf('emailAddress') >= 0) {
			profile.email = profile.nameID;
		}

		const profileKeys = Object.keys(profile);
		for (let i = 0; i < profileKeys.length; i++) {
			const key = profileKeys[i];

			if (key.match(/\./)) {
				profile[key.replace(/\./g, '-')] = profile[key];
				delete profile[key];
			}
		}

		SAMLUtils.log({ msg: 'NameID', profile });
		return callback(null, profile, false);
	}

	private _checkLogoutResponse(doc: Document, callback: IResponseValidateCallback): void {
		const logoutResponse = doc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:protocol', 'LogoutResponse');
		if (!logoutResponse.length) {
			return callback(new Error('Unknown SAML response message'), null, false);
		}

		SAMLUtils.log('Verify status');
		const statusValidateObj = SAMLUtils.validateStatus(doc);
		if (!statusValidateObj.success) {
			return callback(new Error(`Status is: ${statusValidateObj.statusCode}`), null, false);
		}
		SAMLUtils.log('Status ok');

		// @ToDo: Check if this situation is still used
		return callback(null, null, true);
	}

	private getAssertion(response: Element, xml: string): ISAMLAssertion {
		const allAssertions = response.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'Assertion');
		const allEncrypedAssertions = response.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'EncryptedAssertion');

		if (allAssertions.length + allEncrypedAssertions.length > 1) {
			throw new Error('Too many SAML assertions');
		}

		let assertion: XmlParent = allAssertions[0];
		const encAssertion = allEncrypedAssertions[0];
		let newXml = null;

		if (typeof encAssertion !== 'undefined') {
			const options = { key: this.serviceProviderOptions.privateKey };
			const encData = encAssertion.getElementsByTagNameNS('*', 'EncryptedData')[0];
			xmlenc.decrypt(encData, options, function (err, result) {
				if (err) {
					SAMLUtils.error(err);
				}

				const document = new xmldom.DOMParser().parseFromString(result, 'text/xml');
				if (!document) {
					throw new Error('Failed to decrypt SAML assertion');
				}

				const decryptedAssertions = document.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'Assertion');
				if (decryptedAssertions.length) {
					assertion = decryptedAssertions[0];
				}

				newXml = result;
			});
		}

		if (!assertion) {
			throw new Error('Missing SAML assertion');
		}

		return {
			assertion,
			xml: newXml || xml,
		};
	}

	private verifySignatures(response: Element, assertionData: ISAMLAssertion, xml: string): void {
		if (!this.serviceProviderOptions.cert) {
			return;
		}

		const signatureType = this.serviceProviderOptions.signatureValidationType;

		const checkEither = signatureType === 'Either';
		const checkResponse = signatureType === 'Response' || signatureType === 'All' || checkEither;
		const checkAssertion = signatureType === 'Assertion' || signatureType === 'All' || checkEither;
		let anyValidSignature = false;

		if (checkResponse) {
			SAMLUtils.log('Verify Document Signature');
			if (!this.validateResponseSignature(xml, this.serviceProviderOptions.cert, response)) {
				if (!checkEither) {
					SAMLUtils.log('Document Signature WRONG');
					throw new Error('Invalid Signature');
				}
			} else {
				anyValidSignature = true;
			}
			SAMLUtils.log('Document Signature OK');
		}

		if (checkAssertion) {
			SAMLUtils.log('Verify Assertion Signature');
			if (!this.validateAssertionSignature(assertionData.xml, this.serviceProviderOptions.cert, assertionData.assertion)) {
				if (!checkEither) {
					SAMLUtils.log('Assertion Signature WRONG');
					throw new Error('Invalid Assertion signature');
				}
			} else {
				anyValidSignature = true;
			}
			SAMLUtils.log('Assertion Signature OK');
		}

		if (checkEither && !anyValidSignature) {
			SAMLUtils.log('No Valid Signature');
			throw new Error('No valid SAML Signature found');
		}
	}

	private validateResponseSignature(xml: string, cert: string, response: Element): boolean {
		return this.validateSignatureChildren(xml, cert, response);
	}

	private validateAssertionSignature(xml: string, cert: string, assertion: XmlParent): boolean {
		return this.validateSignatureChildren(xml, cert, assertion);
	}

	private validateSignatureChildren(xml: string, cert: string, parent: XmlParent): boolean {
		const xpathSigQuery = ".//*[local-name(.)='Signature' and namespace-uri(.)='http://www.w3.org/2000/09/xmldsig#']";
		const signatures = xmlCrypto.xpath(parent, xpathSigQuery) as Array<Element>;
		let signature = null;

		for (const sign of signatures) {
			if (sign.parentNode !== parent) {
				continue;
			}

			// Too many signatures
			if (signature) {
				SAMLUtils.log('Failed to validate SAML signature: Too Many Signatures');
				return false;
			}

			signature = sign;
		}

		if (!signature) {
			SAMLUtils.log('Failed to validate SAML signature: Signature not found');
			return false;
		}

		return this.validateSignature(xml, cert, signature);
	}

	private validateSignature(xml: string, cert: string, signature: Element): any {
		const sig = new xmlCrypto.SignedXml();

		sig.keyInfoProvider = {
			file: '',
			getKeyInfo: () => '<X509Data></X509Data>',
			getKey: () => Buffer.from(SAMLUtils.certToPEM(cert)),
		};

		sig.loadSignature(signature);

		const result = sig.checkSignature(xml);
		if (!result && sig.validationErrors) {
			SAMLUtils.log(sig.validationErrors);
		}

		return result;
	}

	private getIssuer(assertion: XmlParent): any {
		const issuers = assertion.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'Issuer');
		if (issuers.length > 1) {
			throw new Error('Too many Issuers');
		}

		return issuers[0];
	}

	private getSubject(assertion: XmlParent): XmlParent {
		let subject: XmlParent = assertion.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'Subject')[0];
		const encSubject = assertion.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'EncryptedID')[0];

		if (typeof encSubject !== 'undefined') {
			const options = { key: this.serviceProviderOptions.privateKey };
			xmlenc.decrypt(encSubject.getElementsByTagNameNS('*', 'EncryptedData')[0], options, (err, result) => {
				if (err) {
					SAMLUtils.error(err);
				}
				subject = new xmldom.DOMParser().parseFromString(result, 'text/xml');
			});
		}

		return subject;
	}

	private validateSubjectConditions(subject: XmlParent): void {
		const subjectConfirmation = subject.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'SubjectConfirmation')[0];
		if (subjectConfirmation) {
			const subjectConfirmationData = subjectConfirmation.getElementsByTagNameNS(
				'urn:oasis:names:tc:SAML:2.0:assertion',
				'SubjectConfirmationData',
			)[0];
			if (subjectConfirmationData && !this.validateNotBeforeNotOnOrAfterAssertions(subjectConfirmationData)) {
				throw new Error('NotBefore / NotOnOrAfter assertion failed');
			}
		}
	}

	private validateNotBeforeNotOnOrAfterAssertions(element: Element): boolean {
		const sysnow = new Date();
		const allowedclockdrift = this.serviceProviderOptions.allowedClockDrift || 0;

		const now = new Date(sysnow.getTime() + allowedclockdrift);

		if (element.hasAttribute('NotBefore')) {
			const notBefore: string | null = element.getAttribute('NotBefore');

			if (!notBefore) {
				return false;
			}

			const date = new Date(notBefore);
			if (now < date) {
				return false;
			}
		}

		if (element.hasAttribute('NotOnOrAfter')) {
			const notOnOrAfter: string | null = element.getAttribute('NotOnOrAfter');
			if (!notOnOrAfter) {
				return false;
			}

			const date = new Date(notOnOrAfter);

			if (now >= date) {
				return false;
			}
		}

		return true;
	}

	private validateAssertionConditions(assertion: XmlParent): void {
		const conditions = assertion.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'Conditions')[0];
		if (conditions && !this.validateNotBeforeNotOnOrAfterAssertions(conditions)) {
			throw new Error('NotBefore / NotOnOrAfter assertion failed');
		}
	}

	private mapAttributes(attributeStatement: Element, profile: Record<string, any>): void {
		SAMLUtils.log(`Attribute Statement found in SAML response: ${attributeStatement}`);
		const attributes = attributeStatement.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'Attribute');
		SAMLUtils.log(`Attributes will be processed: ${attributes.length}`);

		if (attributes) {
			for (let i = 0; i < attributes.length; i++) {
				const values = attributes[i].getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'AttributeValue');
				let value;
				if (values.length === 1) {
					value = values[0].textContent;
				} else {
					value = [];
					for (let j = 0; j < values.length; j++) {
						value.push(values[j].textContent);
					}
				}

				const key = attributes[i].getAttribute('Name');
				if (key) {
					SAMLUtils.log(`Attribute:  ${attributes[i]} has ${values.length} value(s).`);
					SAMLUtils.log(`Adding attribute from SAML response to profile: ${key} = ${value}`);
					profile[key] = value;
				}
			}
		} else {
			SAMLUtils.log('No Attributes found in SAML attribute statement.');
		}

		if (!profile.mail && profile['urn:oid:0.9.2342.19200300.100.1.3']) {
			// See http://www.incommonfederation.org/attributesummary.html for definition of attribute OIDs
			profile.mail = profile['urn:oid:0.9.2342.19200300.100.1.3'];
		}

		if (!profile.email && profile['urn:oid:1.2.840.113549.1.9.1']) {
			profile.email = profile['urn:oid:1.2.840.113549.1.9.1'];
		}

		if (!profile.displayName && profile['urn:oid:2.16.840.1.113730.3.1.241']) {
			profile.displayName = profile['urn:oid:2.16.840.1.113730.3.1.241'];
		}

		if (!profile.eppn && profile['urn:oid:1.3.6.1.4.1.5923.1.1.1.6']) {
			profile.eppn = profile['urn:oid:1.3.6.1.4.1.5923.1.1.1.6'];
		}

		if (!profile.email && profile.mail) {
			profile.email = profile.mail;
		}

		if (!profile.cn && profile['urn:oid:2.5.4.3']) {
			profile.cn = profile['urn:oid:2.5.4.3'];
		}
	}
}
