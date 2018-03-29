import ldapjs from 'ldapjs';
import Bunyan from 'bunyan';

const logger = new Logger('LDAP', {
	sections: {
		connection: 'Connection',
		bind: 'Bind',
		search: 'Search',
		auth: 'Auth'
	}
});

export default class LDAP {
	constructor() {
		this.ldapjs = ldapjs;

		this.connected = false;

		this.options = {
			host: RocketChat.settings.get('LDAP_Host'),
			port: RocketChat.settings.get('LDAP_Port'),
			Reconnect: RocketChat.settings.get('LDAP_Reconnect'),
			Internal_Log_Level: RocketChat.settings.get('LDAP_Internal_Log_Level'),
			timeout: RocketChat.settings.get('LDAP_Timeout'),
			connect_timeout: RocketChat.settings.get('LDAP_Connect_Timeout'),
			idle_timeout: RocketChat.settings.get('LDAP_Idle_Timeout'),
			encryption: RocketChat.settings.get('LDAP_Encryption'),
			ca_cert: RocketChat.settings.get('LDAP_CA_Cert'),
			reject_unauthorized: RocketChat.settings.get('LDAP_Reject_Unauthorized') || false,
			Authentication: RocketChat.settings.get('LDAP_Authentication'),
			Authentication_UserDN: RocketChat.settings.get('LDAP_Authentication_UserDN'),
			Authentication_Password: RocketChat.settings.get('LDAP_Authentication_Password'),
			BaseDN: RocketChat.settings.get('LDAP_BaseDN'),
			User_Search_Filter: RocketChat.settings.get('LDAP_User_Search_Filter'),
			User_Search_Scope: RocketChat.settings.get('LDAP_User_Search_Scope'),
			User_Search_Field: RocketChat.settings.get('LDAP_User_Search_Field'),
			Search_Page_Size: RocketChat.settings.get('LDAP_Search_Page_Size'),
			Search_Size_Limit: RocketChat.settings.get('LDAP_Search_Size_Limit'),
			group_filter_enabled: RocketChat.settings.get('LDAP_Group_Filter_Enable'),
			group_filter_object_class: RocketChat.settings.get('LDAP_Group_Filter_ObjectClass'),
			group_filter_group_id_attribute: RocketChat.settings.get('LDAP_Group_Filter_Group_Id_Attribute'),
			group_filter_group_member_attribute: RocketChat.settings.get('LDAP_Group_Filter_Group_Member_Attribute'),
			group_filter_group_member_format: RocketChat.settings.get('LDAP_Group_Filter_Group_Member_Format'),
			group_filter_group_name: RocketChat.settings.get('LDAP_Group_Filter_Group_Name')
		};
	}

	connectSync(...args) {
		if (!this._connectSync) {
			this._connectSync = Meteor.wrapAsync(this.connectAsync, this);
		}
		return this._connectSync(...args);
	}

	searchAllSync(...args) {
		if (!this._searchAllSync) {
			this._searchAllSync = Meteor.wrapAsync(this.searchAllAsync, this);
		}
		return this._searchAllSync(...args);
	}

	connectAsync(callback) {
		logger.connection.info('Init setup');

		let replied = false;

		const connectionOptions = {
			url: `${ this.options.host }:${ this.options.port }`,
			timeout: this.options.timeout,
			connectTimeout: this.options.connect_timeout,
			idleTimeout: this.options.idle_timeout,
			reconnect: this.options.Reconnect
		};

		if (this.options.Internal_Log_Level !== 'disabled') {
			connectionOptions.log = new Bunyan({
				name: 'ldapjs',
				component: 'client',
				stream: process.stderr,
				level: this.options.Internal_Log_Level
			});
		}

		const tlsOptions = {
			rejectUnauthorized: this.options.reject_unauthorized
		};

		if (this.options.ca_cert && this.options.ca_cert !== '') {
			// Split CA cert into array of strings
			const chainLines = RocketChat.settings.get('LDAP_CA_Cert').split('\n');
			let cert = [];
			const ca = [];
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
			connectionOptions.url = `ldaps://${ connectionOptions.url }`;
			connectionOptions.tlsOptions = tlsOptions;
		} else {
			connectionOptions.url = `ldap://${ connectionOptions.url }`;
		}

		logger.connection.info('Connecting', connectionOptions.url);
		logger.connection.debug('connectionOptions', connectionOptions);

		this.client = ldapjs.createClient(connectionOptions);

		this.bindSync = Meteor.wrapAsync(this.client.bind, this.client);

		this.client.on('error', (error) => {
			logger.connection.error('connection', error);
			if (replied === false) {
				replied = true;
				callback(error, null);
			}
		});

		this.client.on('idle', () => {
			logger.search.info('Idle');
			this.disconnect();
		});

		this.client.on('close', () => {
			logger.search.info('Closed');
		});

		if (this.options.encryption === 'tls') {
			// Set host parameter for tls.connect which is used by ldapjs starttls. This shouldn't be needed in newer nodejs versions (e.g v5.6.0).
			// https://github.com/RocketChat/Rocket.Chat/issues/2035
			// https://github.com/mcavage/node-ldapjs/issues/349
			tlsOptions.host = this.options.host;

			logger.connection.info('Starting TLS');
			logger.connection.debug('tlsOptions', tlsOptions);

			this.client.starttls(tlsOptions, null, (error, response) => {
				if (error) {
					logger.connection.error('TLS connection', error);
					if (replied === false) {
						replied = true;
						callback(error, null);
					}
					return;
				}

				logger.connection.info('TLS connected');
				this.connected = true;
				if (replied === false) {
					replied = true;
					callback(null, response);
				}
			});
		} else {
			this.client.on('connect', (response) => {
				logger.connection.info('LDAP connected');
				this.connected = true;
				if (replied === false) {
					replied = true;
					callback(null, response);
				}
			});
		}

		setTimeout(() => {
			if (replied === false) {
				logger.connection.error('connection time out', connectionOptions.connectTimeout);
				replied = true;
				callback(new Error('Timeout'));
			}
		}, connectionOptions.connectTimeout);
	}

	getUserFilter(username) {
		const filter = [];

		if (this.options.User_Search_Filter !== '') {
			if (this.options.User_Search_Filter[0] === '(') {
				filter.push(`${ this.options.User_Search_Filter }`);
			} else {
				filter.push(`(${ this.options.User_Search_Filter })`);
			}
		}

		const usernameFilter = this.options.User_Search_Field.split(',').map(item => `(${ item }=${ username })`);

		if (usernameFilter.length === 0) {
			logger.error('LDAP_LDAP_User_Search_Field not defined');
		} else if (usernameFilter.length === 1) {
			filter.push(`${ usernameFilter[0] }`);
		} else {
			filter.push(`(|${ usernameFilter.join('') })`);
		}

		return `(&${ filter.join('') })`;
	}

	bindIfNecessary() {
		if (this.domainBinded === true) {
			return;
		}

		if (this.options.Authentication !== true) {
			return;
		}

		logger.bind.info('Binding UserDN', this.options.Authentication_UserDN);
		this.bindSync(this.options.Authentication_UserDN, this.options.Authentication_Password);
		this.domainBinded = true;
	}

	searchUsersSync(username, page) {
		this.bindIfNecessary();

		const searchOptions = {
			filter: this.getUserFilter(username),
			scope: this.options.User_Search_Scope || 'sub',
			sizeLimit: this.options.Search_Size_Limit
		};

		if (this.options.Search_Page_Size > 0) {
			searchOptions.paged = {
				pageSize: this.options.Search_Page_Size,
				pagePause: !!page
			};
		}

		logger.search.info('Searching user', username);
		logger.search.debug('searchOptions', searchOptions);
		logger.search.debug('BaseDN', this.options.BaseDN);

		if (page) {
			return this.searchAllPaged(this.options.BaseDN, searchOptions, page);
		}

		return this.searchAllSync(this.options.BaseDN, searchOptions);
	}

	getUserByIdSync(id, attribute) {
		this.bindIfNecessary();

		const Unique_Identifier_Field = RocketChat.settings.get('LDAP_Unique_Identifier_Field').split(',');

		let filter;

		if (attribute) {
			filter = new this.ldapjs.filters.EqualityFilter({
				attribute,
				value: new Buffer(id, 'hex')
			});
		} else {
			const filters = [];
			Unique_Identifier_Field.forEach((item) => {
				filters.push(new this.ldapjs.filters.EqualityFilter({
					attribute: item,
					value: new Buffer(id, 'hex')
				}));
			});

			filter = new this.ldapjs.filters.OrFilter({filters});
		}

		const searchOptions = {
			filter,
			scope: 'sub'
		};

		logger.search.info('Searching by id', id);
		logger.search.debug('search filter', searchOptions.filter.toString());
		logger.search.debug('BaseDN', this.options.BaseDN);

		const result = this.searchAllSync(this.options.BaseDN, searchOptions);

		if (!Array.isArray(result) || result.length === 0) {
			return;
		}

		if (result.length > 1) {
			logger.search.error('Search by id', id, 'returned', result.length, 'records');
		}

		return result[0];
	}

	getUserByUsernameSync(username) {
		this.bindIfNecessary();

		const searchOptions = {
			filter: this.getUserFilter(username),
			scope: this.options.User_Search_Scope || 'sub'
		};

		logger.search.info('Searching user', username);
		logger.search.debug('searchOptions', searchOptions);
		logger.search.debug('BaseDN', this.options.BaseDN);

		const result = this.searchAllSync(this.options.BaseDN, searchOptions);

		if (!Array.isArray(result) || result.length === 0) {
			return;
		}

		if (result.length > 1) {
			logger.search.error('Search by username', username, 'returned', result.length, 'records');
		}

		return result[0];
	}

	isUserInGroup(username) {
		if (!this.options.group_filter_enabled) {
			return true;
		}

		const filter = ['(&'];

		if (this.options.group_filter_object_class !== '') {
			filter.push(`(objectclass=${ this.options.group_filter_object_class })`);
		}

		if (this.options.group_filter_group_member_attribute !== '') {
			filter.push(`(${ this.options.group_filter_group_member_attribute }=${ this.options.group_filter_group_member_format })`);
		}

		if (this.options.group_filter_group_id_attribute !== '') {
			filter.push(`(${ this.options.group_filter_group_id_attribute }=${ this.options.group_filter_group_name })`);
		}
		filter.push(')');

		const searchOptions = {
			filter: filter.join('').replace(/#{username}/g, username),
			scope: 'sub'
		};

		logger.search.debug('Group filter LDAP:', searchOptions.filter);

		const result = this.searchAllSync(this.options.BaseDN, searchOptions);

		if (!Array.isArray(result) || result.length === 0) {
			return false;
		}
		return true;
	}

	extractLdapEntryData(entry) {
		const values = {
			_raw: entry.raw
		};

		Object.keys(values._raw).forEach((key) => {
			const value = values._raw[key];

			if (!['thumbnailPhoto', 'jpegPhoto'].includes(key)) {
				if (value instanceof Buffer) {
					values[key] = value.toString();
				} else {
					values[key] = value;
				}
			}
		});

		return values;
	}

	searchAllPaged(BaseDN, options, page) {
		this.bindIfNecessary();

		const processPage = ({entries, title, end, next}) => {
			logger.search.info(title);
			// Force LDAP idle to wait the record processing
			this.client._updateIdle(true);
			page(null, entries, {end, next: () => {
				// Reset idle timer
				this.client._updateIdle();
				next && next();
			}});
		};

		this.client.search(BaseDN, options, (error, res) => {
			if (error) {
				logger.search.error(error);
				page(error);
				return;
			}

			res.on('error', (error) => {
				logger.search.error(error);
				page(error);
				return;
			});

			let entries = [];

			const internalPageSize = options.paged && options.paged.pageSize > 0 ? options.paged.pageSize * 2 : 500;

			res.on('searchEntry', (entry) => {
				entries.push(this.extractLdapEntryData(entry));

				if (entries.length >= internalPageSize) {
					processPage({
						entries,
						title: 'Internal Page',
						end: false
					});
					entries = [];
				}
			});

			res.on('page', (result, next) => {
				if (!next) {
					this.client._updateIdle(true);
					processPage({
						entries,
						title: 'Final Page',
						end: true
					});
				} else if (entries.length) {
					logger.search.info('Page');
					processPage({
						entries,
						title: 'Page',
						end: false,
						next
					});
					entries = [];
				}
			});

			res.on('end', () => {
				if (entries.length) {
					processPage({
						entries,
						title: 'Final Page',
						end: true
					});
					entries = [];
				}
			});
		});
	}

	searchAllAsync(BaseDN, options, callback) {
		this.bindIfNecessary();

		this.client.search(BaseDN, options, (error, res) => {
			if (error) {
				logger.search.error(error);
				callback(error);
				return;
			}

			res.on('error', (error) => {
				logger.search.error(error);
				callback(error);
				return;
			});

			const entries = [];

			res.on('searchEntry', (entry) => {
				entries.push(this.extractLdapEntryData(entry));
			});

			res.on('end', () => {
				logger.search.info('Search result count', entries.length);
				callback(null, entries);
			});
		});
	}

	authSync(dn, password) {
		logger.auth.info('Authenticating', dn);

		try {
			this.bindSync(dn, password);
			logger.auth.info('Authenticated', dn);
			return true;
		} catch (error) {
			logger.auth.info('Not authenticated', dn);
			logger.auth.debug('error', error);
			return false;
		}
	}

	disconnect() {
		this.connected = false;
		this.domainBinded = false;
		logger.connection.info('Disconecting');
		this.client.unbind();
	}
}
