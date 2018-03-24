/* globals SAML:true */

import zlib from 'zlib';
import xmlCrypto from 'xml-crypto';
import crypto from 'crypto';
import xmldom from 'xmldom';
import querystring from 'querystring';
import xmlbuilder from 'xmlbuilder';
import array2string from 'arraybuffer-to-string';

// var prefixMatch = new RegExp(/(?!xmlns)^.*:/);


SAML = function(options) {
	this.options = this.initialize(options);
};

// var stripPrefix = function(str) {
// 	return str.replace(prefixMatch, '');
// };

SAML.prototype.initialize = function(options) {
	if (!options) {
		options = {};
	}

	if (!options.protocol) {
		options.protocol = 'https://';
	}

	if (!options.path) {
		options.path = '/saml/consume';
	}

	if (!options.issuer) {
		options.issuer = 'onelogin_saml';
	}

	if (options.identifierFormat === undefined) {
		options.identifierFormat = 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress';
	}

	if (options.authnContext === undefined) {
		options.authnContext = 'urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport';
	}

	return options;
};

SAML.prototype.generateUniqueID = function() {
	const chars = 'abcdef0123456789';
	let uniqueID = 'id-';
	for (let i = 0; i < 20; i++) {
		uniqueID += chars.substr(Math.floor((Math.random() * 15)), 1);
	}
	return uniqueID;
};

SAML.prototype.generateInstant = function() {
	return new Date().toISOString();
};

SAML.prototype.signRequest = function(xml) {
	const signer = crypto.createSign('RSA-SHA1');
	signer.update(xml);
	return signer.sign(this.options.privateKey, 'base64');
};

SAML.prototype.generateAuthorizeRequest = function(req) {
	let id = `_${ this.generateUniqueID() }`;
	const instant = this.generateInstant();

	// Post-auth destination
	let callbackUrl;
	if (this.options.callbackUrl) {
		callbackUrl = this.options.callbackUrl;
	} else {
		callbackUrl = this.options.protocol + req.headers.host + this.options.path;
	}

	if (this.options.id) {
		id = this.options.id;
	}

	let request =
		`<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ID="${ id }" Version="2.0" IssueInstant="${ instant}" ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" AssertionConsumerServiceURL="${ callbackUrl }" Destination="${
			this.options.entryPoint }">` +
		`<saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">${ this.options.issuer }</saml:Issuer>\n`;

	if (this.options.identifierFormat) {
		request += `<samlp:NameIDPolicy xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" Format="${ this.options.identifierFormat}" AllowCreate="true"></samlp:NameIDPolicy>\n`;
	}

	request +=
		'<samlp:RequestedAuthnContext xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" Comparison="exact">' +
		'<saml:AuthnContextClassRef xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml:AuthnContextClassRef></samlp:RequestedAuthnContext>\n' +
		'</samlp:AuthnRequest>';

	return request;
};

SAML.prototype.generateLogoutRequest = function(options) {
	// options should be of the form
	// nameId: <nameId as submitted during SAML SSO>
	// sessionIndex: sessionIndex
	// --- NO SAMLsettings: <Meteor.setting.saml  entry for the provider you want to SLO from

	const id = `_${ this.generateUniqueID() }`;
	const instant = this.generateInstant();

	let request = `${ '<samlp:LogoutRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ' +
		'xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="' }${ id }" Version="2.0" IssueInstant="${ instant}" Destination="${ this.options.idpSLORedirectURL }">` +
		`<saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">${ this.options.issuer }</saml:Issuer>` +
		`<saml:NameID Format="${ this.options.identifierFormat }">${ options.nameID }</saml:NameID>` +
		'</samlp:LogoutRequest>';

	request = `${ '<samlp:LogoutRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"  ' +
		'ID="' }${ id }" ` +
		'Version="2.0" ' +
		`IssueInstant="${ instant }" ` +
		`Destination="${ this.options.idpSLORedirectURL }" ` +
		'>' +
		`<saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">${ this.options.issuer }</saml:Issuer>` +
		'<saml:NameID xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ' +
		'NameQualifier="http://id.init8.net:8080/openam" ' +
		`SPNameQualifier="${ this.options.issuer }" ` +
		`Format="${ this.options.identifierFormat }">${
			options.nameID }</saml:NameID>` +
		`<samlp:SessionIndex xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol">${ options.sessionIndex }</samlp:SessionIndex>` +
		'</samlp:LogoutRequest>';
	if (Meteor.settings.debug) {
		console.log('------- SAML Logout request -----------');
		console.log(request);
	}
	return {
		request,
		id
	};
};

SAML.prototype.requestToUrl = function(request, operation, callback) {
	const self = this;
	zlib.deflateRaw(request, function(err, buffer) {
		if (err) {
			return callback(err);
		}

		const base64 = buffer.toString('base64');
		let target = self.options.entryPoint;

		if (operation === 'logout') {
			if (self.options.idpSLORedirectURL) {
				target = self.options.idpSLORedirectURL;
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
			relayState = self.options.provider;
		}

		const samlRequest = {
			SAMLRequest: base64,
			RelayState: relayState
		};

		if (self.options.privateCert) {
			samlRequest.SigAlg = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1';
			samlRequest.Signature = self.signRequest(querystring.stringify(samlRequest));
		}

		target += querystring.stringify(samlRequest);

		if (Meteor.settings.debug) {
			console.log(`requestToUrl: ${ target }`);
		}
		if (operation === 'logout') {
			// in case of logout we want to be redirected back to the Meteor app.
			return callback(null, target);

		} else {
			callback(null, target);
		}
	});
};

SAML.prototype.getAuthorizeUrl = function(req, callback) {
	const request = this.generateAuthorizeRequest(req);

	this.requestToUrl(request, 'authorize', callback);
};

SAML.prototype.getLogoutUrl = function(req, callback) {
	const request = this.generateLogoutRequest(req);

	this.requestToUrl(request, 'logout', callback);
};

SAML.prototype.certToPEM = function (cert) {
	cert = cert.match(/.{1,64}/g).join('\n');
	cert = `-----BEGIN CERTIFICATE-----\n${ cert }`;
	cert = `${ cert }\n-----END CERTIFICATE-----\n`;
	return cert;
};

// functionfindChilds(node, localName, namespace) {
// 	var res = [];
// 	for (var i = 0; i < node.childNodes.length; i++) {
// 		var child = node.childNodes[i];
// 		if (child.localName === localName && (child.namespaceURI === namespace || !namespace)) {
// 			res.push(child);
// 		}
// 	}
// 	return res;
// }

SAML.prototype.validateStatus = function(doc) {
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
		statusCode: status
	};
};

SAML.prototype.validateSignature = function(xml, cert) {
	const self = this;

	const doc = new xmldom.DOMParser().parseFromString(xml);
	const signature = xmlCrypto.xpath(doc, '//*[local-name(.)=\'Signature\' and namespace-uri(.)=\'http://www.w3.org/2000/09/xmldsig#\']')[0];

	const sig = new xmlCrypto.SignedXml();

	sig.keyInfoProvider = {
		getKeyInfo(/*key*/) {
			return '<X509Data></X509Data>';
		},
		getKey(/*keyInfo*/) {
			return self.certToPEM(cert);
		}
	};

	sig.loadSignature(signature);

	return sig.checkSignature(xml);
};

SAML.prototype.validateLogoutResponse = function(samlResponse, callback) {
	const self = this;
	const compressedSAMLResponse = new Buffer(samlResponse, 'base64');
	zlib.inflateRaw(compressedSAMLResponse, function(err, decoded) {
		if (err) {
			if (Meteor.settings.debug) {
				console.log(`Error while inflating. ${ err }`);
			}
		} else {
			console.log(`constructing new DOM parser: ${ Object.prototype.toString.call(decoded) }`);
			console.log(`>>>> ${ decoded }`);
			const doc = new xmldom.DOMParser().parseFromString(array2string(decoded), 'text/xml');
			if (doc) {
				const response = doc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:protocol', 'LogoutResponse')[0];
				if (response) {

					// TBD. Check if this msg corresponds to one we sent
					var inResponseTo;
					try {
						inResponseTo = response.getAttribute('InResponseTo');
						if (Meteor.settings.debug) {
							console.log(`In Response to: ${ inResponseTo }`);
						}
					} catch (e) {
						if (Meteor.settings.debug) {
							console.log(`Caught error: ${ e }`);
							const msg = doc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:protocol', 'StatusMessage');
							console.log(`Unexpected msg from IDP. Does your session still exist at IDP? Idp returned: \n ${ msg }`);
						}
					}


					const statusValidateObj = self.validateStatus(doc);

					if (statusValidateObj.success) {
						callback(null, inResponseTo);
					} else {
						callback('Error. Logout not confirmed by IDP', null);

					}
				} else {
					callback('No Response Found', null);
				}
			}
		}

	});
};

SAML.prototype.validateResponse = function(samlResponse, relayState, callback) {
	const self = this;
	const xml = new Buffer(samlResponse, 'base64').toString('utf8');
	// We currently use RelayState to save SAML provider
	if (Meteor.settings.debug) {
		console.log(`Validating response with relay state: ${ xml }`);
	}

	const doc = new xmldom.DOMParser().parseFromString(xml, 'text/xml');

	if (doc) {

		if (Meteor.settings.debug) {
			console.log('Verify status');
		}
		const statusValidateObj = self.validateStatus(doc);

		if (statusValidateObj.success) {
			if (Meteor.settings.debug) {
				console.log('Status ok');
			}
			// Verify signature
			if (Meteor.settings.debug) {
				console.log('Verify signature');
			}
			if (self.options.cert && !self.validateSignature(xml, self.options.cert)) {
				if (Meteor.settings.debug) {
					console.log('Signature WRONG');
				}
				return callback(new Error('Invalid signature'), null, false);
			}
			if (Meteor.settings.debug) {
				console.log('Signature OK');
			}
			const response = doc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:protocol', 'Response')[0];
			if (response) {
				if (Meteor.settings.debug) {
					console.log('Got response');
				}

				const assertion = response.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'Assertion')[0];
				if (!assertion) {
					return callback(new Error('Missing SAML assertion'), null, false);
				}

				const profile = {};

				if (response.hasAttribute('InResponseTo')) {
					profile.inResponseToId = response.getAttribute('InResponseTo');
				}

				const issuer = assertion.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'Issuer')[0];
				if (issuer) {
					profile.issuer = issuer.textContent;
				}

				const subject = assertion.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'Subject')[0];

				if (subject) {
					const nameID = subject.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'NameID')[0];
					if (nameID) {
						profile.nameID = nameID.textContent;

						if (nameID.hasAttribute('Format')) {
							profile.nameIDFormat = nameID.getAttribute('Format');
						}
					}
				}

				const authnStatement = assertion.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'AuthnStatement')[0];

				if (authnStatement) {
					if (authnStatement.hasAttribute('SessionIndex')) {

						profile.sessionIndex = authnStatement.getAttribute('SessionIndex');
						if (Meteor.settings.debug) {
							console.log(`Session Index: ${ profile.sessionIndex }`);
						}
					} else if (Meteor.settings.debug) {
						console.log('No Session Index Found');
					}


				} else if (Meteor.settings.debug) {
					console.log('No AuthN Statement found');
				}

				const attributeStatement = assertion.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'AttributeStatement')[0];
				if (attributeStatement) {
					if (Meteor.settings.debug) {
						console.log(`Attribute Statement found in SAML response: ${ attributeStatement }`);
					}
					const attributes = attributeStatement.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'Attribute');
					if (Meteor.settings.debug) {
						console.log(`Attributes will be processed: ${ attributes.length }`);
					}
					if (attributes) {
						for (let i = 0; i < attributes.length; i++) {
							const values = attributes[i].getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'AttributeValue');
							let value;
							if (values.length === 1) {
								value = values[0].textContent;
							} else {
								value = [];
								for (var attributeValue of values) {
									value.push(attributeValue.textContent);
								}
							}
							if (Meteor.settings.debug) {
								console.log(`Name:  ${ attributes[i] }`);
								console.log(`Adding attrinute from SAML response to profile: ${attributes[i].getAttribute('Name')} = ${ value.textContent }`);
							}
							profile[attributes[i].getAttribute('Name')] = value.textContent;

						}
					} else {
						if (Meteor.settings.debug) {
							console.log('No Attributes found in SAML attribute statement.');
						}
					}

					if (!profile.mail && profile['urn:oid:0.9.2342.19200300.100.1.3']) {
						// See http://www.incommonfederation.org/attributesummary.html for definition of attribute OIDs
						profile.mail = profile['urn:oid:0.9.2342.19200300.100.1.3'];
					}

					if (!profile.email && profile.mail) {
						profile.email = profile.mail;
					}
				} else {
					if (Meteor.settings.debug) {
						console.log('No Attribute Statement found in SAML response.');
					}
				}

				if (!profile.email && profile.nameID && profile.nameIDFormat && profile.nameIDFormat.indexOf('emailAddress') >= 0) {
					profile.email = profile.nameID;
				}
				if (Meteor.settings.debug) {
					console.log(`NameID: ${ JSON.stringify(profile) }`);
				}

				callback(null, profile, false);
			} else {
				const logoutResponse = doc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:protocol', 'LogoutResponse');

				if (logoutResponse) {
					callback(null, null, true);
				} else {
					return callback(new Error('Unknown SAML response message'), null, false);
				}

			}
		} else {
			return callback(new Error(`Status is:  ${ statusValidateObj.statusCode }`), null, false);
		}
	}

};

let decryptionCert;
SAML.prototype.generateServiceProviderMetadata = function(callbackUrl) {

	if (!decryptionCert) {
		decryptionCert = this.options.privateCert;
	}

	if (!this.options.callbackUrl && !callbackUrl) {
		throw new Error(
			'Unable to generate service provider metadata when callbackUrl option is not set');
	}

	const metadata = {
		'EntityDescriptor': {
			'@xmlns': 'urn:oasis:names:tc:SAML:2.0:metadata',
			'@xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#',
			'@entityID': this.options.issuer,
			'SPSSODescriptor': {
				'@protocolSupportEnumeration': 'urn:oasis:names:tc:SAML:2.0:protocol',
				'SingleLogoutService': {
					'@Binding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
					'@Location': `${ Meteor.absoluteUrl() }_saml/logout/${ this.options.provider }/`,
					'@ResponseLocation': `${ Meteor.absoluteUrl() }_saml/logout/${ this.options.provider }/`
				},
				'NameIDFormat': this.options.identifierFormat,
				'AssertionConsumerService': {
					'@index': '1',
					'@isDefault': 'true',
					'@Binding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
					'@Location': callbackUrl
				}
			}
		}
	};

	if (this.options.privateKey) {
		if (!decryptionCert) {
			throw new Error(
				'Missing decryptionCert while generating metadata for decrypting service provider');
		}

		decryptionCert = decryptionCert.replace(/-+BEGIN CERTIFICATE-+\r?\n?/, '');
		decryptionCert = decryptionCert.replace(/-+END CERTIFICATE-+\r?\n?/, '');
		decryptionCert = decryptionCert.replace(/\r\n/g, '\n');

		metadata['EntityDescriptor']['SPSSODescriptor']['KeyDescriptor'] = {
			'ds:KeyInfo': {
				'ds:X509Data': {
					'ds:X509Certificate': {
						'#text': decryptionCert
					}
				}
			},
			'EncryptionMethod': [
				// this should be the set that the xmlenc library supports
				{
					'@Algorithm': 'http://www.w3.org/2001/04/xmlenc#aes256-cbc'
				},
				{
					'@Algorithm': 'http://www.w3.org/2001/04/xmlenc#aes128-cbc'
				},
				{
					'@Algorithm': 'http://www.w3.org/2001/04/xmlenc#tripledes-cbc'
				}
			]
		};
	}

	return xmlbuilder.create(metadata).end({
		pretty: true,
		indent: '  ',
		newline: '\n'
	});
};
