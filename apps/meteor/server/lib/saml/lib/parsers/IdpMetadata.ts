import xmldom from '@xmldom/xmldom';

import { SAMLUtils } from '../Utils';

const MD_NS = 'urn:oasis:names:tc:SAML:2.0:metadata';
const DS_NS = 'http://www.w3.org/2000/09/xmldsig#';
const REDIRECT_BINDING = 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect';
const SAML2_PROTOCOL = 'urn:oasis:names:tc:SAML:2.0:protocol';

type IdpMetadataResult = {
	entryPoint?: string;
	idpSLORedirectURL?: string;
	cert?: string;
	identifierFormat?: string;
	warnings: string[];
};

type ExtractedValue = {
	value?: string;
	warning?: string;
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
	const doc = new xmldom.DOMParser({
		errorHandler: () => {
			throw new InvalidIdpMetadataError('invalid-xml');
		},
	}).parseFromString(xml, 'text/xml');

	if (!doc) {
		throw new InvalidIdpMetadataError('invalid-xml');
	}

	const entityDescriptor = childrenOf(doc, 'EntityDescriptor')[0];
	if (!entityDescriptor) {
		throw new InvalidIdpMetadataError('root-is-not-entity-descriptor');
	}

	const idpDescriptors = childrenOf(entityDescriptor, 'IDPSSODescriptor');
	if (!idpDescriptors.length) {
		throw new InvalidIdpMetadataError('no-idp-sso-descriptor');
	}

	const idpDescriptor = idpDescriptors.find((descriptor) =>
		(descriptor.getAttribute('protocolSupportEnumeration') ?? '').split(/\s+/).includes(SAML2_PROTOCOL),
	);
	if (!idpDescriptor) {
		throw new InvalidIdpMetadataError('no-saml2-idp-sso-descriptor');
	}

	return idpDescriptor;
};

const extractSigningCert = (idp: Element): ExtractedValue => {
	const certs = childrenOf(idp, 'KeyDescriptor')
		.filter((kd) => {
			const use = kd.getAttribute('use');
			return !use || use === 'signing';
		})
		.map((kd) => kd.getElementsByTagNameNS(DS_NS, 'X509Certificate')[0]?.textContent?.trim())
		.map((raw) => (raw ? SAMLUtils.normalizeCert(raw) : undefined))
		.filter((cert): cert is string => !!cert && SAMLUtils.isParsableCertificate(cert));

	if (!certs.length) {
		return { warning: 'SAML_Metadata_warning_no_valid_cert' };
	}

	const warning = certs.length > 1 ? 'SAML_Metadata_warning_multiple_certs' : undefined;

	return { value: certs[0], warning };
};

const findRedirectLocation = (services: Element[]): string | undefined =>
	services
		.filter((s) => s.getAttribute('Binding') === REDIRECT_BINDING)
		.map((s) => s.getAttribute('Location'))
		.find((location): location is string => !!location && isHttpUrl(location));

const extractEntryPoint = (idp: Element): ExtractedValue => {
	const value = findRedirectLocation(childrenOf(idp, 'SingleSignOnService'));
	const warning = value ? undefined : 'SAML_Metadata_warning_no_redirect_binding';

	return { value, warning };
};

const extractSloUrl = (idp: Element): ExtractedValue => {
	const services = childrenOf(idp, 'SingleLogoutService');
	if (!services.length) {
		return {};
	}

	const value = findRedirectLocation(services);
	const warning = value ? undefined : 'SAML_Metadata_warning_no_slo_redirect_binding';

	return { value, warning };
};

const extractIdentifierFormat = (idp: Element): ExtractedValue => {
	const formats = childrenOf(idp, 'NameIDFormat')
		.map((n) => n.textContent?.trim())
		.filter((v): v is string => !!v);

	const warning = formats.length > 1 ? 'SAML_Metadata_warning_multiple_nameid_formats' : undefined;

	return {
		value: formats[0],
		warning,
	};
};

export function parseIdpMetadata(xml: string): IdpMetadataResult {
	const idp = parseIdpDescriptor(xml);

	const cert = extractSigningCert(idp);
	const entryPoint = extractEntryPoint(idp);
	const sloUrl = extractSloUrl(idp);
	const identifierFormat = extractIdentifierFormat(idp);
	const warnings = [cert, entryPoint, sloUrl, identifierFormat].flatMap(({ warning }) => warning ?? []);

	return {
		cert: cert.value,
		entryPoint: entryPoint.value,
		idpSLORedirectURL: sloUrl.value,
		identifierFormat: identifierFormat.value,
		warnings,
	};
}
