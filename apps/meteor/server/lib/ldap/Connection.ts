import ldapjs from 'ldapjs';
import type {
	ILDAPConnectionOptions,
	LDAPEncryptionType,
	LDAPSearchScope,
	ILDAPEntry,
	ILDAPCallback,
	ILDAPPageCallback,
} from '@rocket.chat/core-typings';

import { settings } from '../../../app/settings/server';
import { logger, connLogger, searchLogger, authLogger, bindLogger, mapLogger } from './Logger';
import { getLDAPConditionalSetting } from './getLDAPConditionalSetting';

interface ILDAPEntryCallback<T> {
	(entry: ldapjs.SearchEntry): T | undefined;
}

interface ILDAPSearchEndCallback {
	(error?: any): void;
}

interface ILDAPSearchPageCallback {
	(result: ldapjs.SearchEntry[]): void;
}

interface ILDAPSearchAllCallbacks<T> {
	dataCallback?: ILDAPSearchPageCallback;
	endCallback?: ILDAPSearchEndCallback;
	entryCallback?: ILDAPEntryCallback<T>;
}

type ILDAPExtractedValue = string | Array<ILDAPExtractedValue>;

export class LDAPConnection {
	public ldapjs: any;

	public connected: boolean;

	public options: ILDAPConnectionOptions;

	public client: ldapjs.Client;

	private _receivedResponse: boolean;

	private _connectionTimedOut: boolean;

	private _connectionCallback: ILDAPCallback;

	private usingAuthentication: boolean;

	constructor() {
		this.ldapjs = ldapjs;

		this.connected = false;
		this._receivedResponse = false;
		this._connectionTimedOut = false;

		this.options = {
			host: settings.get<string>('LDAP_Host') ?? '',
			port: settings.get<number>('LDAP_Port') ?? 389,
			reconnect: settings.get<boolean>('LDAP_Reconnect') ?? false,
			timeout: settings.get<number>('LDAP_Timeout') ?? 60000,
			connectionTimeout: settings.get<number>('LDAP_Connect_Timeout') ?? 1000,
			idleTimeout: settings.get<number>('LDAP_Idle_Timeout') ?? 1000,
			encryption: settings.get<LDAPEncryptionType>('LDAP_Encryption') ?? 'plain',
			caCert: settings.get<string>('LDAP_CA_Cert'),
			rejectUnauthorized: settings.get<boolean>('LDAP_Reject_Unauthorized') || false,
			baseDN: settings.get<string>('LDAP_BaseDN') ?? '',
			userSearchFilter: settings.get<string>('LDAP_User_Search_Filter') ?? '',
			userSearchScope: settings.get<LDAPSearchScope>('LDAP_User_Search_Scope') ?? 'sub',
			userSearchField: getLDAPConditionalSetting<string>('LDAP_User_Search_Field') ?? '',
			searchPageSize: settings.get<number>('LDAP_Search_Page_Size') ?? 250,
			searchSizeLimit: settings.get<number>('LDAP_Search_Size_Limit') ?? 1000,
			uniqueIdentifierField: settings.get<string>('LDAP_Unique_Identifier_Field'),
			groupFilterEnabled: settings.get<boolean>('LDAP_Group_Filter_Enable') ?? false,
			groupFilterObjectClass: settings.get<string>('LDAP_Group_Filter_ObjectClass'),
			groupFilterGroupIdAttribute: settings.get<string>('LDAP_Group_Filter_Group_Id_Attribute'),
			groupFilterGroupMemberAttribute: settings.get<string>('LDAP_Group_Filter_Group_Member_Attribute'),
			groupFilterGroupMemberFormat: settings.get<string>('LDAP_Group_Filter_Group_Member_Format'),
			groupFilterGroupName: settings.get<string>('LDAP_Group_Filter_Group_Name'),
			authentication: settings.get<boolean>('LDAP_Authentication') ?? false,
			authenticationUserDN: settings.get<string>('LDAP_Authentication_UserDN') ?? '',
			authenticationPassword: settings.get<string>('LDAP_Authentication_Password') ?? '',
			attributesToQuery: this.parseAttributeList(settings.get<string>('LDAP_User_Search_AttributesToQuery')),
		};

		if (!this.options.host) {
			logger.warn('LDAP Host is not configured.');
		}
		if (!this.options.baseDN) {
			logger.warn('LDAP Search BaseDN is not configured.');
		}
	}

	public async connect(): Promise<any> {
		return new Promise((resolve, reject) => {
			this.initializeConnection((error, result) => {
				if (error) {
					return reject(error);
				}

				return resolve(result);
			});
		});
	}

	public disconnect(): void {
		this.usingAuthentication = false;
		this.connected = false;
		connLogger.info('Disconnecting');

		if (this.client) {
			this.client.unbind();
		}
	}

	public async testConnection(): Promise<void> {
		try {
			await this.connect();
			await this.maybeBindDN();
		} finally {
			this.disconnect();
		}
	}

	public async searchByUsername(escapedUsername: string): Promise<ILDAPEntry[]> {
		const searchOptions: ldapjs.SearchOptions = {
			filter: this.getUserFilter(escapedUsername),
			scope: this.options.userSearchScope || 'sub',
			sizeLimit: this.options.searchSizeLimit,
			attributes: this.options.attributesToQuery,
		};

		if (this.options.searchPageSize > 0) {
			searchOptions.paged = {
				pageSize: this.options.searchPageSize,
				pagePause: false,
			};
		}

		searchLogger.info({
			msg: 'Searching by username',
			username: escapedUsername,
			baseDN: this.options.baseDN,
			searchOptions,
		});
		return this.search(this.options.baseDN, searchOptions);
	}

	public async findOneByUsername(username: string): Promise<ILDAPEntry | undefined> {
		const results = await this.searchByUsername(username);

		if (results.length === 1) {
			return results[0];
		}
	}

	public async searchById(id: string, attribute?: string): Promise<ILDAPEntry[]> {
		const searchOptions: ldapjs.SearchOptions = {
			scope: this.options.userSearchScope || 'sub',
			attributes: this.options.attributesToQuery,
		};

		if (attribute) {
			searchOptions.filter = new this.ldapjs.filters.EqualityFilter({
				attribute,
				value: Buffer.from(id, 'hex'),
			});
		} else if (this.options.uniqueIdentifierField) {
			// If we don't know what attribute the id came from, we have to look for all of them.
			const possibleFields = this.options.uniqueIdentifierField.split(',').concat(this.options.userSearchField.split(','));
			const filters = [];
			for (const field of possibleFields) {
				if (!field) {
					continue;
				}

				filters.push(
					new this.ldapjs.filters.EqualityFilter({
						attribute: field,
						value: Buffer.from(id, 'hex'),
					}),
				);
			}
			searchOptions.filter = new this.ldapjs.filters.OrFilter({ filters });
		} else {
			throw new Error('Unique Identifier Field is not configured.');
		}

		searchLogger.info({ msg: 'Searching by id', id });
		searchLogger.debug({ msg: 'search filter', searchOptions, baseDN: this.options.baseDN });

		return this.search(this.options.baseDN, searchOptions);
	}

	public async findOneById(id: string, attribute?: string): Promise<ILDAPEntry | undefined> {
		const results = await this.searchById(id, attribute);
		if (results.length === 1) {
			return results[0];
		}
	}

	public async searchAllUsers<T = ldapjs.SearchEntry>({
		dataCallback,
		endCallback,
		entryCallback,
	}: ILDAPSearchAllCallbacks<T>): Promise<void> {
		searchLogger.info('Searching all users');

		const searchOptions: ldapjs.SearchOptions = {
			filter: this.getUserFilter('*'),
			scope: this.options.userSearchScope || 'sub',
			sizeLimit: this.options.searchSizeLimit,
			attributes: this.options.attributesToQuery,
		};

		if (this.options.searchPageSize > 0) {
			let count = 0;
			await this.doPagedSearch<T>(
				this.options.baseDN,
				searchOptions,
				this.options.searchPageSize,
				(error, entries: ldapjs.SearchEntry[], { end, next } = { end: false, next: undefined }) => {
					if (error) {
						endCallback?.(error);
						return;
					}

					count += entries.length;
					dataCallback?.(entries);
					if (end) {
						endCallback?.();
					}

					if (next) {
						next(count);
					}
				},
				entryCallback,
			);
			return;
		}

		await this.doAsyncSearch(
			this.options.baseDN,
			searchOptions,
			(error, result) => {
				dataCallback?.(result);
				endCallback?.(error);
			},
			entryCallback,
		);
	}

	public async authenticate(dn: string, password: string): Promise<boolean> {
		authLogger.info({ msg: 'Authenticating', dn });

		try {
			await this.bindDN(dn, password);

			authLogger.info({ msg: 'Authenticated', dn });
			return true;
		} catch (error) {
			authLogger.info({ msg: 'Not authenticated', dn });
			authLogger.debug({ msg: 'error', error });
			return false;
		}
	}

	public async search(baseDN: string, searchOptions: ldapjs.SearchOptions): Promise<ILDAPEntry[]> {
		return this.doCustomSearch<ILDAPEntry>(baseDN, searchOptions, (entry) => this.extractLdapEntryData(entry));
	}

	public async searchRaw(baseDN: string, searchOptions: ldapjs.SearchOptions): Promise<ldapjs.SearchEntry[]> {
		return this.doCustomSearch<ldapjs.SearchEntry>(baseDN, searchOptions, (entry) => entry);
	}

	public async searchAndCount(baseDN: string, searchOptions: ldapjs.SearchOptions): Promise<number> {
		let count = 0;
		await this.doCustomSearch(baseDN, searchOptions, () => {
			count++;
		});

		return count;
	}

	public extractLdapAttribute(value: Buffer | Buffer[] | string): ILDAPExtractedValue {
		if (Array.isArray(value)) {
			return value.map((item) => this.extractLdapAttribute(item));
		}

		if (value instanceof Buffer) {
			return value.toString();
		}

		return value;
	}

	public extractLdapEntryData(entry: ldapjs.SearchEntry): ILDAPEntry {
		const values: ILDAPEntry = {
			_raw: entry.raw,
		};

		Object.keys(values._raw).forEach((key) => {
			values[key] = this.extractLdapAttribute(values._raw[key]);

			const dataType = typeof values[key];
			// eslint-disable-next-line no-control-regex
			if (dataType === 'string' && values[key].length > 100 && /[\x00-\x1F]/.test(values[key])) {
				mapLogger.debug({
					msg: 'Extracted Attribute',
					key,
					type: dataType,
					length: values[key].length,
					value: `${values[key].substr(0, 100)}...`,
				});
				return;
			}

			mapLogger.debug({ msg: 'Extracted Attribute', key, type: dataType, value: values[key] });
		});

		return values;
	}

	public async doCustomSearch<T>(baseDN: string, searchOptions: ldapjs.SearchOptions, entryCallback: ILDAPEntryCallback<T>): Promise<T[]> {
		await this.runBeforeSearch(searchOptions);

		if (!searchOptions.scope) {
			searchOptions.scope = this.options.userSearchScope || 'sub';
		}
		searchLogger.debug({ msg: 'searchOptions', searchOptions, baseDN });

		let realEntries = 0;

		return new Promise((resolve, reject) => {
			this.client.search(baseDN, searchOptions, (error, res: ldapjs.SearchCallbackResponse) => {
				if (error) {
					searchLogger.error(error);
					reject(error);
					return;
				}

				res.on('error', (error) => {
					searchLogger.error(error);
					reject(error);
				});

				const entries: T[] = [];

				res.on('searchEntry', (entry) => {
					try {
						const result = entryCallback(entry);
						if (result) {
							entries.push(result as T);
						}
						realEntries++;
					} catch (e) {
						searchLogger.error(e);
						throw e;
					}
				});

				res.on('end', () => {
					searchLogger.info(`LDAP Search found ${realEntries} entries and loaded the data of ${entries.length}.`);
					resolve(entries);
				});
			});
		});
	}

	/*
		Create an LDAP search filter based on the username
	*/
	public getUserFilter(username: string): string {
		const filter: string[] = [];

		this.addUserFilters(filter, username);

		const usernameFilter = this.options.userSearchField.split(',').map((item) => `(${item}=${username})`);

		if (usernameFilter.length === 0) {
			logger.error('LDAP_LDAP_User_Search_Field not defined');
		} else if (usernameFilter.length === 1) {
			filter.push(`${usernameFilter[0]}`);
		} else {
			filter.push(`(|${usernameFilter.join('')})`);
		}

		return `(&${filter.join('')})`;
	}

	public async isUserAcceptedByGroupFilter(username: string, userdn: string): Promise<boolean> {
		if (!this.options.groupFilterEnabled) {
			return true;
		}

		const filter = ['(&'];

		if (this.options.groupFilterObjectClass) {
			filter.push(`(objectclass=${this.options.groupFilterObjectClass})`);
		}

		if (this.options.groupFilterGroupMemberAttribute) {
			filter.push(`(${this.options.groupFilterGroupMemberAttribute}=${this.options.groupFilterGroupMemberFormat})`);
		}

		if (this.options.groupFilterGroupIdAttribute) {
			filter.push(`(${this.options.groupFilterGroupIdAttribute}=${this.options.groupFilterGroupName})`);
		}
		filter.push(')');

		const searchOptions: ldapjs.SearchOptions = {
			filter: filter
				.join('')
				.replace(/#{username}/g, username)
				.replace(/#{userdn}/g, userdn),
			scope: 'sub',
		};

		searchLogger.debug({ msg: 'Group filter LDAP:', filter: searchOptions.filter });

		const result = await this.searchRaw(this.options.baseDN, searchOptions);

		if (!Array.isArray(result) || result.length === 0) {
			return false;
		}
		return true;
	}

	protected addUserFilters(filters: string[], _username: string): void {
		const { userSearchFilter } = this.options;

		if (userSearchFilter !== '') {
			if (userSearchFilter[0] === '(') {
				filters.push(`${userSearchFilter}`);
			} else {
				filters.push(`(${userSearchFilter})`);
			}
		}
	}

	public async bindDN(dn: string, password: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			try {
				this.client.bind(dn, password, (error) => {
					if (error) {
						return reject(error);
					}

					resolve();
				});
			} catch (error) {
				reject(error);
			}
		});
	}

	private async doAsyncSearch<T = ldapjs.SearchEntry>(
		baseDN: string,
		searchOptions: ldapjs.SearchOptions,
		callback: ILDAPCallback,
		entryCallback?: ILDAPEntryCallback<T>,
	): Promise<void> {
		await this.runBeforeSearch(searchOptions);

		searchLogger.debug({ msg: 'searchOptions', searchOptions, baseDN });

		this.client.search(baseDN, searchOptions, (error: ldapjs.Error | null, res: ldapjs.SearchCallbackResponse): void => {
			if (error) {
				searchLogger.error(error);
				callback(error);
				return;
			}

			res.on('error', (error) => {
				searchLogger.error(error);
				callback(error);
			});

			const entries: T[] = [];

			res.on('searchEntry', (entry) => {
				try {
					const result = entryCallback ? entryCallback(entry) : entry;
					entries.push(result as T);
				} catch (e) {
					searchLogger.error(e);
					throw e;
				}
			});

			res.on('end', () => {
				searchLogger.info({ msg: 'Search result count', count: entries.length });
				callback(null, entries);
			});
		});
	}

	private processSearchPage<T>(
		{ entries, title, end, next }: { entries: T[]; title: string; end: boolean; next?: () => void },
		callback: ILDAPPageCallback,
	): void {
		searchLogger.info(title);
		// Force LDAP idle to wait the record processing
		this._updateIdle(true);

		callback(null, entries, {
			end,
			next: () => {
				// Reset idle timer
				this._updateIdle();
				next?.();
			},
		});
	}

	private async doPagedSearch<T = ldapjs.SearchEntry>(
		baseDN: string,
		searchOptions: ldapjs.SearchOptions,
		pageSize: number,
		callback: ILDAPPageCallback,
		entryCallback?: ILDAPEntryCallback<T>,
	): Promise<void> {
		searchOptions.paged = {
			pageSize,
			pagePause: true,
		};

		await this.runBeforeSearch(searchOptions);

		searchLogger.debug({ msg: 'searchOptions', searchOptions, baseDN });

		this.client.search(baseDN, searchOptions, (error: ldapjs.Error | null, res: ldapjs.SearchCallbackResponse): void => {
			if (error) {
				searchLogger.error(error);
				callback(error);
				return;
			}

			res.on('error', (error) => {
				searchLogger.error(error);
				callback(error);
			});

			let entries: T[] = [];
			const internalPageSize = pageSize * 2;

			res.on('searchEntry', (entry) => {
				try {
					const result = entryCallback ? entryCallback(entry) : entry;
					entries.push(result as T);

					if (entries.length >= internalPageSize) {
						this.processSearchPage<T>(
							{
								entries,
								title: 'Internal Page',
								end: false,
							},
							callback,
						);
						entries = [];
					}
				} catch (e) {
					searchLogger.error(e);
					throw e;
				}
			});

			res.on('page', (_result, next) => {
				if (!next) {
					this._updateIdle(true);
					this.processSearchPage<T>(
						{
							entries,
							title: 'Final Page',
							end: true,
						},
						callback,
					);
					entries = [];
				} else if (entries.length) {
					this.processSearchPage<T>(
						{
							entries,
							title: 'Page',
							end: false,
							next,
						},
						callback,
					);
					entries = [];
				}
			});

			res.on('end', () => {
				if (entries.length) {
					this.processSearchPage<T>(
						{
							entries,
							title: 'Final Page',
							end: true,
						},
						callback,
					);
					entries = [];
				}
			});
		});
	}

	private _updateIdle(override?: boolean): void {
		// @ts-ignore calling a private method
		this.client._updateIdle(override);
	}

	protected async maybeBindDN(): Promise<void> {
		if (this.usingAuthentication) {
			return;
		}

		if (!this.options.authentication) {
			return;
		}

		if (!this.options.authenticationUserDN) {
			logger.error('Invalid UserDN for authentication');
			return;
		}

		bindLogger.info({ msg: 'Binding UserDN', userDN: this.options.authenticationUserDN });
		try {
			await this.bindDN(this.options.authenticationUserDN, this.options.authenticationPassword);
			this.usingAuthentication = true;
		} catch (error) {
			authLogger.error({
				msg: 'Base Authentication Issue',
				err: error,
				dn: this.options.authenticationUserDN,
			});
			this.usingAuthentication = false;
		}
	}

	protected async runBeforeSearch(_searchOptions: ldapjs.SearchOptions): Promise<void> {
		return this.maybeBindDN();
	}

	/*
		Get list of options to initialize a new ldapjs Client
	*/
	private getClientOptions(): {
		clientOptions: ldapjs.ClientOptions;
		tlsOptions: Record<string, any>;
	} {
		const clientOptions: ldapjs.ClientOptions = {
			url: `${this.options.host}:${this.options.port}`,
			timeout: this.options.timeout,
			connectTimeout: this.options.connectionTimeout,
			idleTimeout: this.options.idleTimeout,
			reconnect: this.options.reconnect,
			log: connLogger,
		};

		const tlsOptions: Record<string, any> = {
			rejectUnauthorized: this.options.rejectUnauthorized,
		};

		if (this.options.caCert) {
			// Split CA cert into array of strings
			const chainLines = this.options.caCert.split('\n');
			let cert: string[] = [];
			const ca: string[] = [];
			chainLines.forEach((line) => {
				cert.push(line);
				if (line.match(/-END CERTIFICATE-/)) {
					ca.push(cert.join('\n'));
					cert = [];
				}
			});
			tlsOptions.ca = ca;
		}

		if (this.options.encryption === 'ssl') {
			clientOptions.url = `ldaps://${clientOptions.url}`;
			clientOptions.tlsOptions = tlsOptions;
		} else {
			clientOptions.url = `ldap://${clientOptions.url}`;
		}

		return {
			clientOptions,
			tlsOptions,
		};
	}

	private handleConnectionResponse(error: any, response?: any): void {
		if (!this._receivedResponse) {
			this._receivedResponse = true;
			this._connectionCallback(error, response);
			return;
		}

		if (this._connectionTimedOut && !error) {
			connLogger.info('Received a response after the connection timedout.');
		} else {
			logger.debug('Ignored error/response:');
		}

		if (error) {
			connLogger.debug(error);
		} else {
			connLogger.debug(response);
		}
	}

	private initializeConnection(callback: ILDAPCallback): void {
		connLogger.info('Init Setup');
		this._receivedResponse = false;
		this._connectionTimedOut = false;
		this._connectionCallback = callback;

		const { clientOptions, tlsOptions } = this.getClientOptions();
		connLogger.info({ msg: 'Connecting', url: clientOptions.url });
		connLogger.debug({ msg: 'clientOptions', clientOptions });

		this.client = ldapjs.createClient(clientOptions);

		this.client.on('error', (error) => {
			connLogger.error(error);
			this.handleConnectionResponse(error, null);
		});

		this.client.on('idle', () => {
			searchLogger.info('Idle');
			this.disconnect();
		});

		this.client.on('close', () => {
			searchLogger.info('Closed');
		});

		if (this.options.encryption === 'tls') {
			// Set host parameter for tls.connect which is used by ldapjs starttls. This may not be needed anymore
			// https://github.com/RocketChat/Rocket.Chat/issues/2035
			// https://github.com/mcavage/node-ldapjs/issues/349
			tlsOptions.host = this.options.host;

			connLogger.info('Starting TLS');
			connLogger.debug({ msg: 'tlsOptions', tlsOptions });

			this.client.starttls(tlsOptions, null, (error, response) => {
				if (error) {
					connLogger.error({ msg: 'TLS connection', error });
					return this.handleConnectionResponse(error, null);
				}

				connLogger.info('TLS connected');
				this.connected = true;
				this.handleConnectionResponse(null, response);
			});
		} else {
			this.client.on('connect', (response) => {
				connLogger.info('LDAP connected');
				this.connected = true;
				this.handleConnectionResponse(null, response);
			});
		}

		setTimeout(() => {
			if (!this._receivedResponse) {
				connLogger.error({ msg: 'connection time out', timeout: clientOptions.connectTimeout });
				this.handleConnectionResponse(new Error('Timeout'));
				this._connectionTimedOut = true;
			}
		}, clientOptions.connectTimeout);
	}

	private parseAttributeList(csv: string | undefined): Array<string> {
		if (!csv) {
			return ['*', '+'];
		}

		const list = csv.split(',').map((item) => item.trim());
		if (!list?.length) {
			return ['*', '+'];
		}

		return list;
	}
}
