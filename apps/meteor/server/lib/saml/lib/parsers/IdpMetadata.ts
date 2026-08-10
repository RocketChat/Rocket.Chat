import xmldom from '@xmldom/xmldom';

import { SAMLUtils } from '../Utils';

const MD_NS = 'urn:oasis:names:tc:SAML:2.0:metadata';
const DS_NS = 'http://www.w3.org/2000/09/xmldsig#';
const REDIRECT_BINDING = 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect';

type IdpMetadataResult = {
	entryPoint?: string;
	idpSLORedirectURL?: string;
	cert?: string;
	identifierFormat?: string;
	warnings: string[];
};

export class InvalidIdpMetadataError extends Error {}

const isHttpUrl = (value: string): boolean => {
	try {
		const { protocol } = new URL(value);
		return protocol === 'http:' || protocol === 'https:';
	} catch {
		return false;
	}
};

const childrenOf = (el: Element | Document, tag: string): Element[] =>
	Array.from(el.getElementsByTagNameNS(MD_NS, tag)).filter((child) => child.parentNode === el);

const parseIdpDescriptor = (xml: string): Element => {
	let parseError: Error | null = null;
	// xmldom auto-closes unclosed tags without firing `error`/`fatalError`, reporting it only through
	// `warning` — so any warning is treated as fatal to reject malformed input.
	const capture = (e: unknown): void => {
		parseError = e instanceof Error ? e : new Error(String(e));
	};
	const doc = new xmldom.DOMParser({
		errorHandler: { warning: capture, error: capture, fatalError: capture },
	}).parseFromString(xml, 'text/xml');

	if (!doc || parseError) {
		throw new InvalidIdpMetadataError('invalid-xml');
	}

	const entityDescriptors = childrenOf(doc, 'EntityDescriptor');
	if (entityDescriptors.length !== 1 || entityDescriptors[0] !== doc.documentElement) {
		throw new InvalidIdpMetadataError('root-is-not-entity-descriptor');
	}

	const idpDescriptor = childrenOf(entityDescriptors[0], 'IDPSSODescriptor')[0];
	if (!idpDescriptor) {
		throw new InvalidIdpMetadataError('no-idp-sso-descriptor');
	}
	return idpDescriptor;
};

const extractSigningCert = (idp: Element, warnings: string[]): string | undefined => {
	const signingKeys = childrenOf(idp, 'KeyDescriptor').filter((kd) => {
		const use = kd.getAttribute('use');
		return !use || use === 'signing';
	});
	if (signingKeys.length > 1) {
		warnings.push('SAML_Metadata_warning_multiple_certs');
	}
	for (const kd of signingKeys) {
		const raw = kd.getElementsByTagNameNS(DS_NS, 'X509Certificate')[0]?.textContent?.trim();
		const normalized = raw ? SAMLUtils.normalizeCert(raw) : undefined;
		if (normalized && SAMLUtils.isValidCertificate(normalized)) {
			return normalized;
		}
	}
	return undefined;
};

const extractEntryPoint = (idp: Element, warnings: string[]): string | undefined => {
	const entryPoint = childrenOf(idp, 'SingleSignOnService')
		.filter((s) => s.getAttribute('Binding') === REDIRECT_BINDING)
		.map((s) => s.getAttribute('Location'))
		.find((location): location is string => !!location && isHttpUrl(location));
	if (!entryPoint) {
		warnings.push('SAML_Metadata_warning_no_redirect_binding');
	}
	return entryPoint;
};

const extractSloUrl = (idp: Element, warnings: string[]): string | undefined => {
	const services = childrenOf(idp, 'SingleLogoutService');
	if (!services.length) {
		return undefined;
	}

	const location = services
		.filter((s) => s.getAttribute('Binding') === REDIRECT_BINDING)
		.map((s) => s.getAttribute('Location'))
		.find((location): location is string => !!location && isHttpUrl(location));
	if (!location) {
		warnings.push('SAML_Metadata_warning_no_slo_redirect_binding');
	}
	return location;
};

const extractIdentifierFormat = (idp: Element, warnings: string[]): string | undefined => {
	const formats = childrenOf(idp, 'NameIDFormat')
		.map((n) => n.textContent?.trim())
		.filter((v): v is string => !!v);
	if (formats.length > 1) {
		warnings.push('SAML_Metadata_warning_multiple_nameid_formats');
	}
	return formats[0];
};

export function parseIdpMetadata(xml: string): IdpMetadataResult {
	const idp = parseIdpDescriptor(xml);
	const warnings: string[] = [];
	return {
		cert: extractSigningCert(idp, warnings),
		entryPoint: extractEntryPoint(idp, warnings),
		idpSLORedirectURL: extractSloUrl(idp, warnings),
		identifierFormat: extractIdentifierFormat(idp, warnings),
		warnings,
	};
}
