import zlib from 'zlib';
import crypto from 'crypto';
import querystring from 'querystring';

import { Meteor } from 'meteor/meteor';
import xmlCrypto from 'xml-crypto';
import xmldom from 'xmldom';
import xmlbuilder from 'xmlbuilder';
import array2string from 'arraybuffer-to-string';
import xmlenc from 'xml-encryption';

import {
	defaultAuthnContextTemplate,
	defaultAuthRequestTemplate,
	defaultLogoutResponseTemplate,
	defaultLogoutRequestTemplate,
	defaultNameIDTemplate,
	defaultIdentifierFormat,
	defaultAuthnContext,
} from './templates';
import { logger } from './saml_rocketchat';

function debugLog(...args) {
	if (Meteor.settings.debug) {
		logger.info(...args);
	}
}

let decryptionCert;

export class SAML {
	constructor(service) {
		this.service = this.initialize(service);
	}

	initialize(service) {
		if (!service) {
			service = {};
		}

		if (!service.protocol) {
			service.protocol = 'https://';
		}

		if (!service.path) {
			service.path = '/saml/consume';
		}

		if (!service.issuer) {
			service.issuer = 'onelogin_saml';
		}

		service.allowedClockDrift = parseInt(service.allowedClockDrift) || 0;

		return service;
	}

	generateUniqueID() {
		const chars = 'abcdef0123456789';
		let uniqueID = 'id-';
		for (let i = 0; i < 20; i++) {
			uniqueID += chars.substr(Math.floor(Math.random() * 15), 1);
		}
		return uniqueID;
	}

	generateInstant() {
		return new Date().toISOString();
	}

	signRequest(xml) {
		const signer = crypto.createSign('RSA-SHA1');
		signer.update(xml);
		return signer.sign(this.service.privateKey, 'base64');
	}

	identifierFormatTagTemplate() {
		if (!this.service.identifierFormat) {
			return '';
		}

		return this.service.nameIDPolicyTemplate || defaultNameIDTemplate;
	}

	authnContextTagTemplate() {
		if (!this.service.customAuthnContext) {
			return '';
		}

		return this.service.authnContextTemplate || defaultAuthnContextTemplate;
	}

	authorizeRequestTemplate() {
		const identifierFormatTag = this.identifierFormatTagTemplate();
		const authnContextTag = this.authnContextTagTemplate();

		const data = {
			__identifierFormatTag__: identifierFormatTag,
			__authnContextTag__: authnContextTag,
		};

		return this.fillTemplateData(this.service.authRequestTemplate || defaultAuthRequestTemplate, data);
	}

	fillTemplateData(template, data) {
		let newTemplate = template;

		for (const variable in data) {
			if (variable in data) {
				newTemplate = newTemplate.replace(variable, data[variable]);
			}
		}

		return newTemplate;
	}

	generateAuthorizeRequest(req) {
		let id = `_${ this.generateUniqueID() }`;
		const instant = this.generateInstant();

		// Post-auth destination
		let callbackUrl;
		if (this.service.callbackUrl) {
			callbackUrl = this.service.callbackUrl;
		} else {
			callbackUrl = this.service.protocol + req.headers.host + this.service.path;
		}

		if (this.service.id) {
			id = this.service.id;
		}

		const data = {
			__uniqueId__: id,
			__instant__: instant,
			__callbackUrl__: callbackUrl,
			__entryPoint__: this.service.entryPoint,
			__issuer__: this.service.issuer,
			__identifierFormat__: this.service.identifierFormat || defaultIdentifierFormat,
			__authnContextComparison__: this.service.authnContextComparison || 'exact',
			__authnContext__: this.service.customAuthnContext || defaultAuthnContext,
		};

		const xml = this.fillTemplateData(this.authorizeRequestTemplate(), data);
		console.log(xml);
		return xml;
	}

	generateLogoutResponse() {
		const id = `_${ this.generateUniqueID() }`;
		const instant = this.generateInstant();

		const data = {
			__uniqueId__: id,
			__instant__: instant,
			__idpSLORedirectURL__: this.service.idpSLORedirectURL,
			__issuer__: this.service.issuer,
		};

		const response = this.fillTemplateData(this.service.logoutResponseTemplate || defaultLogoutResponseTemplate, data);

		debugLog('------- SAML Logout response -----------');
		debugLog(response);

		return {
			response,
			id,
		};
	}

	generateLogoutRequest({ nameID, sessionIndex }) {
		// nameId: <nameId as submitted during SAML SSO>
		// sessionIndex: sessionIndex
		// --- NO SAMLsettings: <Meteor.setting.saml  entry for the provider you want to SLO from

		const id = `_${ this.generateUniqueID() }`;
		const instant = this.generateInstant();

		const data = {
			__uniqueId__: id,
			__instant__: instant,
			__idpSLORedirectURL__: this.service.idpSLORedirectURL,
			__issuer__: this.service.issuer,
			__identifierFormat__: this.service.identifierFormat || defaultIdentifierFormat,
			__nameID__: nameID,
			__sessionIndex__: sessionIndex,
		};

		const request = this.fillTemplateData(this.service.logoutRequestTemplate || defaultLogoutRequestTemplate, data);

		debugLog('------- SAML Logout request -----------');
		debugLog(request);

		return {
			request,
			id,
		};
	}

	logoutResponseToUrl(response, callback) {
		const self = this;

		zlib.deflateRaw(response, function(err, buffer) {
			if (err) {
				return callback(err);
			}

			const base64 = buffer.toString('base64');
			let target = self.service.idpSLORedirectURL;

			if (target.indexOf('?') > 0) {
				target += '&';
			} else {
				target += '?';
			}

			// TBD. We should really include a proper RelayState here
			const relayState = Meteor.absoluteUrl();

			const samlResponse = {
				SAMLResponse: base64,
				RelayState: relayState,
			};

			if (self.service.privateCert) {
				samlResponse.SigAlg = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1';
				samlResponse.Signature = self.signRequest(querystring.stringify(samlResponse));
			}

			target += querystring.stringify(samlResponse);

			return callback(null, target);
		});
	}

	requestToUrl(request, operation, callback) {
		const self = this;
		zlib.deflateRaw(request, function(err, buffer) {
			if (err) {
				return callback(err);
			}

			const base64 = buffer.toString('base64');
			let target = self.service.entryPoint;

			if (operation === 'logout') {
				if (self.service.idpSLORedirectURL) {
					target = self.service.idpSLORedirectURL;
				}
			}

			if (target.indexOf('?') > 0) {
				target += '&';
			} else {
				target += '?';
			}

			// TBD. We should really include a proper RelayState here
			let relayState;
			if (operation === 'logout') {
				// in case of logout we want to be redirected back to the Meteor app.
				relayState = Meteor.absoluteUrl();
			} else {
				relayState = self.service.provider;
			}

			const samlRequest = {
				SAMLRequest: base64,
				RelayState: relayState,
			};

			if (self.service.privateCert) {
				samlRequest.SigAlg = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1';
				samlRequest.Signature = self.signRequest(querystring.stringify(samlRequest));
			}

			target += querystring.stringify(samlRequest);

			debugLog(`requestToUrl: ${ target }`);

			if (operation === 'logout') {
				// in case of logout we want to be redirected back to the Meteor app.
				return callback(null, target);
			}
			callback(null, target);
		});
	}

	getAuthorizeUrl(req, callback) {
		const request = this.generateAuthorizeRequest(req);
		debugLog('-----REQUEST------');
		debugLog(request);

		this.requestToUrl(request, 'authorize', callback);
	}

	getLogoutUrl(req, callback) {
		const request = this.generateLogoutRequest(req);

		this.requestToUrl(request, 'logout', callback);
	}

	certToPEM(cert) {
		cert = cert.match(/.{1,64}/g).join('\n');
		cert = `-----BEGIN CERTIFICATE-----\n${ cert }`;
		cert = `${ cert }\n-----END CERTIFICATE-----\n`;
		return cert;
	}

	validateStatus(doc) {
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

	validateSignature(xml, cert, signature) {
		const self = this;
		const sig = new xmlCrypto.SignedXml();

		sig.keyInfoProvider = {
			getKeyInfo(/* key*/) {
				return '<X509Data></X509Data>';
			},
			getKey(/* keyInfo*/) {
				return self.certToPEM(cert);
			},
		};

		sig.loadSignature(signature);

		return sig.checkSignature(xml);
	}

	validateSignatureChildren(xml, cert, parent) {
		const xpathSigQuery = ".//*[local-name(.)='Signature' and namespace-uri(.)='http://www.w3.org/2000/09/xmldsig#']";
		const signatures = xmlCrypto.xpath(parent, xpathSigQuery);
		let signature = null;

		for (const sign of signatures) {
			if (sign.parentNode !== parent) {
				continue;
			}

			// Too many signatures
			if (signature) {
				return false;
			}

			signature = sign;
		}

		if (!signature) {
			return false;
		}

		return this.validateSignature(xml, cert, signature);
	}

	validateResponseSignature(xml, cert, response) {
		return this.validateSignatureChildren(xml, cert, response);
	}

	validateAssertionSignature(xml, cert, assertion) {
		return this.validateSignatureChildren(xml, cert, assertion);
	}

	validateLogoutRequest(samlRequest, callback) {
		const compressedSAMLRequest = new Buffer(samlRequest, 'base64');
		zlib.inflateRaw(compressedSAMLRequest, function(err, decoded) {
			if (err) {
				debugLog(`Error while inflating. ${ err }`);
				return callback(err, null);
			}

			const xmlString = array2string(decoded);
			debugLog(`LogoutRequest: ${ xmlString }`);

			const doc = new xmldom.DOMParser().parseFromString(xmlString, 'text/xml');
			if (!doc) {
				return callback('No Doc Found');
			}

			const request = doc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:protocol', 'LogoutRequest')[0];
			if (!request) {
				return callback('No Request Found');
			}

			try {
				const sessionNode = request.getElementsByTagNameNS('*', 'SessionIndex')[0];
				const nameIdNode = request.getElementsByTagNameNS('*', 'NameID')[0];

				if (!nameIdNode) {
					throw new Error('SAML Logout Request: No NameID node found');
				}

				const idpSession = sessionNode.childNodes[0].nodeValue;
				const nameID = nameIdNode.childNodes[0].nodeValue;

				return callback(null, { idpSession, nameID });
			} catch (e) {
				console.error(e);
				debugLog(`Caught error: ${ e }`);

				const msg = doc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:protocol', 'StatusMessage');
				debugLog(`Unexpected msg from IDP. Does your session still exist at IDP? Idp returned: \n ${ msg }`);

				return callback(e, null);
			}
		});
	}

	validateLogoutResponse(samlResponse, callback) {
		const self = this;
		const compressedSAMLResponse = new Buffer(samlResponse, 'base64');
		zlib.inflateRaw(compressedSAMLResponse, function(err, decoded) {
			if (err) {
				debugLog(`Error while inflating. ${ err }`);
				return callback(err, null);
			}

			debugLog(`LogoutResponse: ${ decoded }`);
			const doc = new xmldom.DOMParser().parseFromString(array2string(decoded), 'text/xml');
			if (!doc) {
				return callback('No Doc Found');
			}

			const response = doc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:protocol', 'LogoutResponse')[0];
			if (!response) {
				return callback('No Response Found', null);
			}

			// TBD. Check if this msg corresponds to one we sent
			let inResponseTo;
			try {
				inResponseTo = response.getAttribute('InResponseTo');
				debugLog(`In Response to: ${ inResponseTo }`);
			} catch (e) {
				debugLog(`Caught error: ${ e }`);
				const msg = doc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:protocol', 'StatusMessage');
				debugLog(`Unexpected msg from IDP. Does your session still exist at IDP? Idp returned: \n ${ msg }`);
			}

			const statusValidateObj = self.validateStatus(doc);
			if (!statusValidateObj.success) {
				return callback('Error. Logout not confirmed by IDP', null);
			}
			return callback(null, inResponseTo);
		});
	}

	mapAttributes(attributeStatement, profile) {
		debugLog(`Attribute Statement found in SAML response: ${ attributeStatement }`);
		const attributes = attributeStatement.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'Attribute');
		debugLog(`Attributes will be processed: ${ attributes.length }`);

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

				debugLog(`Name:  ${ attributes[i] }`);
				debugLog(`Adding attribute from SAML response to profile: ${ key } = ${ value }`);
				profile[key] = value;
			}
		} else {
			debugLog('No Attributes found in SAML attribute statement.');
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

	validateAssertionConditions(assertion) {
		const conditions = assertion.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'Conditions')[0];
		if (conditions && !this.validateNotBeforeNotOnOrAfterAssertions(conditions)) {
			throw new Error('NotBefore / NotOnOrAfter assertion failed');
		}
	}

	validateSubjectConditions(subject) {
		const subjectConfirmation = subject.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'SubjectConfirmation')[0];
		if (subjectConfirmation) {
			const subjectConfirmationData = subjectConfirmation.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'SubjectConfirmationData')[0];
			if (subjectConfirmationData && !this.validateNotBeforeNotOnOrAfterAssertions(subjectConfirmationData)) {
				throw new Error('NotBefore / NotOnOrAfter assertion failed');
			}
		}
	}

	validateNotBeforeNotOnOrAfterAssertions(element) {
		const sysnow = new Date();
		const allowedclockdrift = this.service.allowedClockDrift;

		const now = new Date(sysnow.getTime() + allowedclockdrift);

		if (element.hasAttribute('NotBefore')) {
			const notBefore = element.getAttribute('NotBefore');

			const date = new Date(notBefore);
			if (now < date) {
				return false;
			}
		}

		if (element.hasAttribute('NotOnOrAfter')) {
			const notOnOrAfter = element.getAttribute('NotOnOrAfter');
			const date = new Date(notOnOrAfter);

			if (now >= date) {
				return false;
			}
		}

		return true;
	}

	getAssertion(response) {
		const allAssertions = response.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'Assertion');
		const allEncrypedAssertions = response.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'EncryptedAssertion');

		if (allAssertions.length + allEncrypedAssertions.length > 1) {
			throw new Error('Too many SAML assertions');
		}

		let assertion = allAssertions[0];
		const encAssertion = allEncrypedAssertions[0];


		if (typeof encAssertion !== 'undefined') {
			const options = { key: this.service.privateKey };
			xmlenc.decrypt(encAssertion.getElementsByTagNameNS('*', 'EncryptedData')[0], options, function(err, result) {
				assertion = new xmldom.DOMParser().parseFromString(result, 'text/xml');
			});
		}

		if (!assertion) {
			throw new Error('Missing SAML assertion');
		}

		return assertion;
	}

	verifySignatures(response, assertion, xml) {
		if (!this.service.cert) {
			return;
		}

		const signatureType = this.service.signatureValidationType;

		const checkEither = signatureType === 'Either';
		const checkResponse = signatureType === 'Response' || signatureType === 'All' || checkEither;
		const checkAssertion = signatureType === 'Assertion' || signatureType === 'All' || checkEither;
		let anyValidSignature = false;

		if (checkResponse) {
			debugLog('Verify Document Signature');
			if (!this.validateResponseSignature(xml, this.service.cert, response)) {
				if (!checkEither) {
					debugLog('Document Signature WRONG');
					throw new Error('Invalid Signature');
				}
			} else {
				anyValidSignature = true;
			}
			debugLog('Document Signature OK');
		}

		if (checkAssertion) {
			debugLog('Verify Assertion Signature');
			if (!this.validateAssertionSignature(xml, this.service.cert, assertion)) {
				if (!checkEither) {
					debugLog('Assertion Signature WRONG');
					throw new Error('Invalid Assertion signature');
				}
			} else {
				anyValidSignature = true;
			}
			debugLog('Assertion Signature OK');
		}

		if (checkEither && !anyValidSignature) {
			debugLog('No Valid Signature');
			throw new Error('No valid SAML Signature found');
		}
	}

	getSubject(assertion) {
		let subject = assertion.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'Subject')[0];
		const encSubject = assertion.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'EncryptedID')[0];

		if (typeof encSubject !== 'undefined') {
			const options = { key: this.service.privateKey };
			xmlenc.decrypt(encSubject.getElementsByTagNameNS('*', 'EncryptedData')[0], options, function(err, result) {
				subject = new xmldom.DOMParser().parseFromString(result, 'text/xml');
			});
		}

		return subject;
	}

	getIssuer(assertion) {
		const issuers = assertion.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'Issuer');

		if (issuers.length > 1) {
			throw new Error('Too many Issuers');
		}

		return issuers[0];
	}

	validateResponse(samlResponse, relayState, callback) {
		const self = this;
		const xml = new Buffer(samlResponse, 'base64').toString('utf8');
		// We currently use RelayState to save SAML provider
		debugLog(`Validating response with relay state: ${ xml }`);

		const doc = new xmldom.DOMParser().parseFromString(xml, 'text/xml');
		if (!doc) {
			return callback('No Doc Found');
		}

		debugLog('Verify status');
		const statusValidateObj = self.validateStatus(doc);

		if (!statusValidateObj.success) {
			return callback(new Error(`Status is:  ${ statusValidateObj.statusCode }`), null, false);
		}
		debugLog('Status ok');

		const allResponses = doc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:protocol', 'Response');
		if (allResponses.length !== 1) {
			return callback(new Error('Too many SAML responses'), null, false);
		}

		const response = allResponses[0];
		if (!response) {
			const logoutResponse = doc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:protocol', 'LogoutResponse');

			if (!logoutResponse) {
				return callback(new Error('Unknown SAML response message'), null, false);
			}
			return callback(null, null, true);
		}
		debugLog('Got response');

		let assertion;
		let issuer;

		try {
			assertion = this.getAssertion(response, callback);

			this.verifySignatures(response, assertion, xml);
		} catch (e) {
			return callback(e, null, false);
		}

		const profile = {};

		if (response.hasAttribute('InResponseTo')) {
			profile.inResponseToId = response.getAttribute('InResponseTo');
		}

		try {
			issuer = this.getIssuer(assertion);
		} catch (e) {
			return callback(e, null, false);
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
				return callback(e, null, false);
			}
		}

		try {
			this.validateAssertionConditions(assertion);
		} catch (e) {
			return callback(e, null, false);
		}

		const authnStatement = assertion.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'AuthnStatement')[0];

		if (authnStatement) {
			if (authnStatement.hasAttribute('SessionIndex')) {
				profile.sessionIndex = authnStatement.getAttribute('SessionIndex');
				debugLog(`Session Index: ${ profile.sessionIndex }`);
			} else {
				debugLog('No Session Index Found');
			}
		} else {
			debugLog('No AuthN Statement found');
		}

		const attributeStatement = assertion.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'AttributeStatement')[0];
		if (attributeStatement) {
			this.mapAttributes(attributeStatement, profile);
		} else {
			debugLog('No Attribute Statement found in SAML response.');
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

		debugLog(`NameID: ${ JSON.stringify(profile) }`);
		return callback(null, profile, false);
	}

	generateServiceProviderMetadata(callbackUrl) {
		if (!decryptionCert) {
			decryptionCert = this.service.privateCert;
		}

		if (!this.service.callbackUrl && !callbackUrl) {
			throw new Error(
				'Unable to generate service provider metadata when callbackUrl option is not set');
		}

		const metadata = {
			EntityDescriptor: {
				'@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
				'@xsi:schemaLocation': 'urn:oasis:names:tc:SAML:2.0:metadata https://docs.oasis-open.org/security/saml/v2.0/saml-schema-metadata-2.0.xsd',
				'@xmlns': 'urn:oasis:names:tc:SAML:2.0:metadata',
				'@xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#',
				'@entityID': this.service.issuer,
				SPSSODescriptor: {
					'@protocolSupportEnumeration': 'urn:oasis:names:tc:SAML:2.0:protocol',
				},
			},
		};

		if (this.service.privateKey) {
			if (!decryptionCert) {
				throw new Error(
					'Missing decryptionCert while generating metadata for decrypting service provider');
			}

			decryptionCert = decryptionCert.replace(/-+BEGIN CERTIFICATE-+\r?\n?/, '');
			decryptionCert = decryptionCert.replace(/-+END CERTIFICATE-+\r?\n?/, '');
			decryptionCert = decryptionCert.replace(/\r\n/g, '\n');

			metadata.EntityDescriptor.SPSSODescriptor.KeyDescriptor = {
				'ds:KeyInfo': {
					'ds:X509Data': {
						'ds:X509Certificate': {
							'#text': decryptionCert,
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
			'@Location': `${ Meteor.absoluteUrl() }_saml/logout/${ this.service.provider }/`,
			'@ResponseLocation': `${ Meteor.absoluteUrl() }_saml/logout/${ this.service.provider }/`,
		};
		metadata.EntityDescriptor.SPSSODescriptor.NameIDFormat = this.service.identifierFormat || defaultIdentifierFormat;
		metadata.EntityDescriptor.SPSSODescriptor.AssertionConsumerService = {
			'@index': '1',
			'@isDefault': 'true',
			'@Binding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
			'@Location': callbackUrl,
		};

		return xmlbuilder.create(metadata).end({
			pretty: true,
			indent: '  ',
			newline: '\n',
		});
	}
}
