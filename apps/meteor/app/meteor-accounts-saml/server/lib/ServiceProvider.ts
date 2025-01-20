import crypto from 'crypto';
import querystring from 'querystring';
import util from 'util';
import zlib from 'zlib';

import { Meteor } from 'meteor/meteor';

import { SAMLUtils } from './Utils';
import type { ILogoutResponse } from '../definition/ILogoutResponse';
import type { ISAMLRequest } from '../definition/ISAMLRequest';
import type { IServiceProviderOptions } from '../definition/IServiceProviderOptions';
import type { ILogoutRequestValidateCallback, ILogoutResponseValidateCallback, IResponseValidateCallback } from '../definition/callbacks';
import { AuthorizeRequest } from './generators/AuthorizeRequest';
import { LogoutRequest } from './generators/LogoutRequest';
import { LogoutResponse } from './generators/LogoutResponse';
import { ServiceProviderMetadata } from './generators/ServiceProviderMetadata';
import { LogoutRequestParser } from './parsers/LogoutRequest';
import { LogoutResponseParser } from './parsers/LogoutResponse';
import { ResponseParser } from './parsers/Response';

export class SAMLServiceProvider {
	serviceProviderOptions: IServiceProviderOptions;

	constructor(serviceProviderOptions: IServiceProviderOptions) {
		if (!serviceProviderOptions) {
			throw new Error('SAMLServiceProvider instantiated without an options object');
		}

		this.serviceProviderOptions = serviceProviderOptions;
	}

	private signRequest(xml: string): string {
		const signer = crypto.createSign('RSA-SHA1');
		signer.update(xml);
		return signer.sign(this.serviceProviderOptions.privateKey, 'base64');
	}

	public generateAuthorizeRequest(credentialToken: string): string {
		const identifiedRequest = AuthorizeRequest.generate(this.serviceProviderOptions, credentialToken);
		return identifiedRequest.request;
	}

	public generateLogoutResponse({
		nameID,
		sessionIndex,
		inResponseToId,
	}: {
		nameID: string;
		sessionIndex: string;
		inResponseToId: string;
	}): ILogoutResponse {
		return LogoutResponse.generate(this.serviceProviderOptions, nameID, sessionIndex, inResponseToId);
	}

	public generateLogoutRequest({ nameID, sessionIndex }: { nameID: string; sessionIndex: string }): ISAMLRequest {
		return LogoutRequest.generate(this.serviceProviderOptions, nameID, sessionIndex);
	}

	/*
		This method will generate the response URL with all the query string params and pass it to the callback
	*/
	public logoutResponseToUrl(response: string, callback: (err: string | object | null, url?: string) => void): void {
		zlib.deflateRaw(response, (err, buffer) => {
			if (err) {
				return callback(err);
			}

			try {
				const base64 = buffer.toString('base64');
				let target = this.serviceProviderOptions.idpSLORedirectURL;

				if (target.indexOf('?') > 0) {
					target += '&';
				} else {
					target += '?';
				}

				// TBD. We should really include a proper RelayState here
				const relayState = Meteor.absoluteUrl();

				const samlResponse: Record<string, any> = {
					SAMLResponse: base64,
					RelayState: relayState,
				};

				if (this.serviceProviderOptions.privateCert) {
					samlResponse.SigAlg = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1';
					samlResponse.Signature = this.signRequest(querystring.stringify(samlResponse));
				}

				target += querystring.stringify(samlResponse);

				return callback(null, target);
			} catch (error) {
				return callback(error instanceof Error ? error : String(error));
			}
		});
	}

	/*
		This method will generate the request URL with all the query string params and pass it to the callback
	*/
	public async requestToUrl(request: string, operation: string): Promise<string | undefined> {
		const buffer = await util.promisify(zlib.deflateRaw)(request);
		try {
			const base64 = buffer.toString('base64');
			let target = this.serviceProviderOptions.entryPoint;

			if (operation === 'logout') {
				if (this.serviceProviderOptions.idpSLORedirectURL) {
					target = this.serviceProviderOptions.idpSLORedirectURL;
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
				relayState = this.serviceProviderOptions.provider;
			}

			const samlRequest: Record<string, any> = {
				SAMLRequest: base64,
				RelayState: relayState,
			};

			if (this.serviceProviderOptions.privateCert) {
				samlRequest.SigAlg = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1';
				samlRequest.Signature = this.signRequest(querystring.stringify(samlRequest));
			}

			target += querystring.stringify(samlRequest);

			SAMLUtils.log(`requestToUrl: ${target}`);

			if (operation === 'logout') {
				// in case of logout we want to be redirected back to the Meteor app.
				return target;
			}
			return target;
		} catch (error) {
			throw error instanceof Error ? error : String(error);
		}
	}

	public async getAuthorizeUrl(credentialToken: string): Promise<string | undefined> {
		const request = this.generateAuthorizeRequest(credentialToken);
		SAMLUtils.log('-----REQUEST------');
		SAMLUtils.log(request);

		return this.requestToUrl(request, 'authorize');
	}

	public async validateLogoutRequest(samlRequest: string, callback: ILogoutRequestValidateCallback): Promise<void> {
		await SAMLUtils.inflateXml(
			samlRequest,
			async (xml: string) => {
				const parser = new LogoutRequestParser(this.serviceProviderOptions);
				return parser.validate(xml, callback);
			},
			async (err: string | object | null) => {
				await callback(err, null);
			},
		);
	}

	public async validateLogoutResponse(samlResponse: string, callback: ILogoutResponseValidateCallback): Promise<void> {
		await SAMLUtils.inflateXml(
			samlResponse,
			async (xml: string) => {
				const parser = new LogoutResponseParser(this.serviceProviderOptions);
				return parser.validate(xml, callback);
			},
			async (err: string | object | null) => {
				await callback(err, null);
			},
		);
	}

	public validateResponse(samlResponse: string, callback: IResponseValidateCallback): void {
		const xml = Buffer.from(samlResponse, 'base64').toString('utf8');

		const parser = new ResponseParser(this.serviceProviderOptions);
		return parser.validate(xml, callback);
	}

	public generateServiceProviderMetadata(): string {
		return ServiceProviderMetadata.generate(this.serviceProviderOptions);
	}
}
