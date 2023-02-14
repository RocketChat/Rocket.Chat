import https from 'https';
import url from 'url';
import type { IncomingMessage } from 'http';

import type { Cheerio, CheerioAPI } from 'cheerio';
import { load } from 'cheerio';

export type CasOptions = {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	base_url: string;
	service?: string;
	version: 1.0 | 2.0;
};

export type CasCallbackExtendedData = {
	username?: unknown;
	attributes?: unknown;
	// eslint-disable-next-line @typescript-eslint/naming-convention
	PGTIOU?: unknown;
	ticket?: unknown;
	proxies?: unknown;
};

export type CasCallback = (err: any, status?: unknown, username?: unknown, extended?: CasCallbackExtendedData) => void;

function parseJasigAttributes(elemAttribute: Cheerio<any>, cheerio: CheerioAPI): Record<string, string[]> {
	// "Jasig Style" Attributes:
	//
	//  <cas:serviceResponse xmlns:cas='http://www.yale.edu/tp/cas'>
	//      <cas:authenticationSuccess>
	//          <cas:user>jsmith</cas:user>
	//          <cas:attributes>
	//              <cas:attraStyle>RubyCAS</cas:attraStyle>
	//              <cas:surname>Smith</cas:surname>
	//              <cas:givenName>John</cas:givenName>
	//              <cas:memberOf>CN=Staff,OU=Groups,DC=example,DC=edu</cas:memberOf>
	//              <cas:memberOf>CN=Spanish Department,OU=Departments,...</cas:memberOf>
	//          </cas:attributes>
	//          <cas:proxyGrantingTicket>PGTIOU-84678-8a9d2...</cas:proxyGrantingTicket>
	//      </cas:authenticationSuccess>
	//  </cas:serviceResponse>

	const attributes: Record<string, string[]> = {};
	for (let i = 0; i < elemAttribute.children().length; i++) {
		const node = elemAttribute.children()[i];
		const attrName = node.name.toLowerCase().replace(/cas:/, '');
		if (attrName !== '#text') {
			const attrValue = cheerio(node).text();
			if (!attributes[attrName]) {
				attributes[attrName] = [attrValue];
			} else {
				attributes[attrName].push(attrValue);
			}
		}
	}

	return attributes;
}

function parseRubyCasAttributes(elemSuccess: Cheerio<any>, cheerio: CheerioAPI): Record<string, string[]> {
	// "RubyCAS Style" attributes
	//
	//    <cas:serviceResponse xmlns:cas='http://www.yale.edu/tp/cas'>
	//        <cas:authenticationSuccess>
	//            <cas:user>jsmith</cas:user>
	//
	//            <cas:attraStyle>RubyCAS</cas:attraStyle>
	//            <cas:surname>Smith</cas:surname>
	//            <cas:givenName>John</cas:givenName>
	//            <cas:memberOf>CN=Staff,OU=Groups,DC=example,DC=edu</cas:memberOf>
	//            <cas:memberOf>CN=Spanish Department,OU=Departments,...</cas:memberOf>
	//
	//            <cas:proxyGrantingTicket>PGTIOU-84678-8a9d2...</cas:proxyGrantingTicket>
	//        </cas:authenticationSuccess>
	//    </cas:serviceResponse>

	const attributes: Record<string, string[]> = {};
	for (let i = 0; i < elemSuccess.children().length; i++) {
		const node = elemSuccess.children()[i];
		const tagName = node.name.toLowerCase().replace(/cas:/, '');
		switch (tagName) {
			case 'user':
			case 'proxies':
			case 'proxygrantingticket':
			case '#text':
				// these are not CAS attributes
				break;
			default:
				const attrName = tagName;
				const attrValue = cheerio(node).text();
				if (attrValue !== '') {
					if (!attributes[attrName]) {
						attributes[attrName] = [attrValue];
					} else {
						attributes[attrName].push(attrValue);
					}
				}
				break;
		}
	}

	return attributes;
}

function parseAttributes(elemSuccess: Cheerio<any>, cheerio: CheerioAPI): Record<string, string[]> {
	const elemAttribute = elemSuccess.find('cas\\:attributes').first();
	const isJasig = elemAttribute?.children().length > 0;
	const attributes = isJasig ? parseJasigAttributes(elemAttribute, cheerio) : parseRubyCasAttributes(elemSuccess, cheerio);

	if (Object.keys(attributes).length > 0) {
		return attributes;
	}

	// "Name-Value" attributes.
	//
	// Attribute format from this mailing list thread:
	// http://jasig.275507.n4.nabble.com/CAS-attributes-and-how-they-appear-in-the-CAS-response-td264272.html
	// Note: This is a less widely used format, but in use by at least two institutions.
	//
	//    <cas:serviceResponse xmlns:cas='http://www.yale.edu/tp/cas'>
	//        <cas:authenticationSuccess>
	//            <cas:user>jsmith</cas:user>
	//
	//            <cas:attribute name='attraStyle' value='Name-Value' />
	//            <cas:attribute name='surname' value='Smith' />
	//            <cas:attribute name='givenName' value='John' />
	//            <cas:attribute name='memberOf' value='CN=Staff,OU=Groups,DC=example,DC=edu' />
	//            <cas:attribute name='memberOf' value='CN=Spanish Department,OU=Departments,...' />
	//
	//            <cas:proxyGrantingTicket>PGTIOU-84678-8a9d2sfa23casd</cas:proxyGrantingTicket>
	//        </cas:authenticationSuccess>
	//    </cas:serviceResponse>
	//
	const nodes = elemSuccess.find('cas\\:attribute');
	if (nodes?.length) {
		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i];
			const attrName = node.attribs.name;
			const attrValue = node.attribs.value;

			if (!attributes[attrName]) {
				attributes[attrName] = [attrValue];
			} else {
				attributes[attrName].push(attrValue);
			}
		}
	}

	return attributes;
}

export function validate(options: CasOptions, ticket: string, callback: CasCallback, renew = false): void {
	if (!options.base_url) {
		throw new Error('Required CAS option `base_url` missing.');
	}

	const casUrl = url.parse(options.base_url);
	if (casUrl.protocol !== 'https:') {
		throw new Error('Only https CAS servers are supported.');
	}

	if (!casUrl.hostname) {
		throw new Error('Option `base_url` must be a valid url like: https://example.com/cas');
	}
	const { service, version = 1.0 } = options;
	if (!service) {
		throw new Error('Required CAS option `service` missing.');
	}

	const { hostname, port = '443', pathname = '' } = casUrl;
	const validatePath = version < 2.0 ? 'validate' : 'proxyValidate';

	const query = {
		ticket,
		service,
		...(renew ? { renew: 1 } : {}),
	};

	const queryPath = url.format({
		pathname: `${pathname}/${validatePath}`,
		query,
	});

	const req = https.get(
		{
			host: hostname,
			port,
			path: queryPath,
			rejectUnauthorized: true,
		},
		function (res: IncomingMessage) {
			// Handle server errors
			res.on('error', function (e) {
				callback(e);
			});

			// Read result
			res.setEncoding('utf8');
			let response = '';
			res.on('data', function (chunk) {
				response += chunk;
				if (response.length > 1e6) {
					req.connection?.destroy();
				}
			});

			res.on('end', function () {
				if (version < 2.0) {
					const sections = response.split('\n');
					if (sections.length >= 1) {
						switch (sections[0]) {
							case 'no':
								return callback(undefined, false);
							case 'yes':
								if (sections.length >= 2) {
									return callback(undefined, true, sections[1]);
								}
						}
					}

					return callback(new Error('Bad response format.'));
				}

				// Use cheerio to parse the XML repsonse.
				const cheerio = load(response);

				// Check for auth success
				const elemSuccess = cheerio('cas\\:authenticationSuccess').first();
				if (elemSuccess && elemSuccess.length > 0) {
					const elemUser = elemSuccess.find('cas\\:user').first();
					if (!elemUser || elemUser.length < 1) {
						//  This should never happen
						callback(new Error('No username?'), false);
						return;
					}

					// Got username
					const username = elemUser.text();

					// Look for optional proxy granting ticket
					let pgtIOU;
					const elemPGT = elemSuccess.find('cas\\:proxyGrantingTicket').first();
					if (elemPGT) {
						pgtIOU = elemPGT.text();
					}

					// Look for optional proxies
					const proxies = [];
					const elemProxies = elemSuccess.find('cas\\:proxies');
					for (let i = 0; i < elemProxies.length; i++) {
						proxies.push(cheerio(elemProxies[i]).text().trim());
					}

					// Look for optional attributes
					const attributes = parseAttributes(elemSuccess, cheerio);

					callback(undefined, true, username, {
						username,
						attributes,
						// eslint-disable-next-line @typescript-eslint/naming-convention
						PGTIOU: pgtIOU,
						ticket,
						proxies,
					});
					return;
				} // end if auth success

				// Check for correctly formatted auth failure message
				const elemFailure = cheerio('cas\\:authenticationFailure').first();
				if (elemFailure && elemFailure.length > 0) {
					const code = elemFailure.attr('code');
					const message = `Validation failed [${code}]: ${elemFailure.text()}`;
					callback(new Error(message), false);
					return;
				}

				// The response was not in any expected format, error
				callback(new Error('Bad response format.'));
				console.error(response);
			});
		},
	);

	// Connection error with the CAS server
	req.on('error', function (err) {
		callback(err);
		req.abort();
	});
}
