const ldapjs = LDAPJS;

const logger = new Logger('LDAP', {
	methods: {
		connection_info: { type: 'info' },
		connection_debug: { type: 'debug' },
		connection_error: { type: 'error' },
		bind_info: { type: 'info' },
		search_info: { type: 'info' },
		search_debug: { type: 'debug' },
		search_error: { type: 'error' },
		auth_info: { type: 'info' },
		auth_debug: { type: 'debug' }
	}
});

LDAP = class LDAP {
	constructor(options) {
		const self = this;

		self.ldapjs = ldapjs;

		self.connected = false;

		self.options = {
			host: RocketChat.settings.get('LDAP_Host'),
			port: RocketChat.settings.get('LDAP_Port'),
			encryption: RocketChat.settings.get('LDAP_Encryption'),
			ca_cert: RocketChat.settings.get('LDAP_CA_Cert'),
			reject_unauthorized: RocketChat.settings.get('LDAP_Reject_Unauthorized') || false,
			domain_base: RocketChat.settings.get('LDAP_Domain_Base'),
			use_custom_domain_search: RocketChat.settings.get('LDAP_Use_Custom_Domain_Search'),
			custom_domain_search: RocketChat.settings.get('LDAP_Custom_Domain_Search'),
			domain_search_user: RocketChat.settings.get('LDAP_Domain_Search_User'),
			domain_search_password: RocketChat.settings.get('LDAP_Domain_Search_Password'),
			domain_search_filter: RocketChat.settings.get('LDAP_Domain_Search_Filter'),
			domain_search_user_id: RocketChat.settings.get('LDAP_Domain_Search_User_ID'),
			domain_search_object_class: RocketChat.settings.get('LDAP_Domain_Search_Object_Class'),
			domain_search_object_category: RocketChat.settings.get('LDAP_Domain_Search_Object_Category')
		};

		self.connectSync = Meteor.wrapAsync(self.connectAsync, self);
		self.searchAllSync = Meteor.wrapAsync(self.searchAllAsync, self);
	}

	connectAsync(callback) {
		const self = this;

		logger.connection_info('Init setup');

		let replied = false;

		const connectionOptions = {
			url: `${self.options.host}:${self.options.port}`,
			timeout: 1000 * 5,
			connectTimeout: 1000 * 10,
			idleTimeout: 1000 * 10,
			reconnect: false
		};

		const tlsOptions = {
			rejectUnauthorized: self.options.reject_unauthorized
		};

		if (self.options.ca_cert && self.options.ca_cert !== '') {
			tlsOptions.ca = [self.options.ca_cert];
		}

		if (self.options.encryption === 'ssl') {
			connectionOptions.url = `ldaps://${connectionOptions.url}`;
			connectionOptions.tlsOptions = tlsOptions;
		} else {
			connectionOptions.url = `ldap://${connectionOptions.url}`;
		}

		logger.connection_info('Connecting', connectionOptions.url);
		logger.connection_debug('connectionOptions', connectionOptions);

		self.client = ldapjs.createClient(connectionOptions);

		self.bindSync = Meteor.wrapAsync(self.client.bind, self.client);

		self.client.on('error', function(error) {
			logger.connection_error('connection', error);
			if (replied === false) {
				replied = true;
				callback(error, null);
			}
		});

		if (self.options.encryption === 'tls') {
			logger.connection_info('Starting TLS');
			logger.connection_debug('tlsOptions', tlsOptions);

			self.client.starttls(tlsOptions, null, function(error, response) {
				if (error) {
					logger.connection_error('TLS connection', error);
					if (replied === false) {
						replied = true;
						callback(error, null);
					}
					return;
				}

				logger.connection_info('TLS connected');
				self.connected = true;
				if (replied === false) {
					replied = true;
					callback(null, response);
				}
			});
		} else {
			self.client.on('connect', function(response) {
				logger.connection_info('LDAP connected');
				self.connected = true;
				if (replied === false) {
					replied = true;
					callback(null, response);
				}
			});
		}

		setTimeout(function() {
			if (replied === false) {
				logger.connection_error('connection time out', connectionOptions.timeout);
				replied = true;
				callback(new Error('Timeout'));
			}
		}, connectionOptions.timeout);
	}

	getDomainBindSearch() {
		const self = this;

		if (self.options.use_custom_domain_search === true) {
			let custom_domain_search;
			try {
				custom_domain_search = JSON.parse(self.options.custom_domain_search);
			} catch(error) {
				throw new Error('Invalid Custom Domain Search JSON');
			}

			return {
				filter: custom_domain_search.filter,
				domain_search_user: custom_domain_search.userDN || '',
				domain_search_password: custom_domain_search.password || ''
			};
		}

		let filter = ['(&'];

		if (self.options.domain_search_object_category !== '') {
			filter.push(`(objectCategory=${self.options.domain_search_object_category})`);
		}

		if (self.options.domain_search_object_class !== '') {
			filter.push(`(objectclass=${self.options.domain_search_object_class})`);
		}

		if (self.options.domain_search_filter !== '') {
			filter.push(`(${self.options.domain_search_filter})`);
		}

		domain_search_user_id = self.options.domain_search_user_id.split(',');
		if (domain_search_user_id.length === 1) {
			filter.push(`(${domain_search_user_id[0]}=#{username})`);
		} else {
			filter.push('(|');
			domain_search_user_id.forEach((item) => {
				filter.push(`(${item}=#{username})`);
			});
			filter.push(')');
		}

		filter.push(')');

		return {
			filter: filter.join(''),
			domain_search_user: self.options.domain_search_user || '',
			domain_search_password: self.options.domain_search_password || ''
		};
	}

	bindIfNecessary() {
		const self = this;

		const domain_search = self.getDomainBindSearch();

		if (domain_search.domain_search_user !== '' && domain_search.domain_search_password !== '') {
			logger.bind_info('Binding admin user', domain_search.domain_search_user);
			self.bindSync(domain_search.domain_search_user, domain_search.domain_search_password);
		}
	}

	searchUsersSync(username) {
		const self = this;

		self.bindIfNecessary();

		const domain_search = self.getDomainBindSearch();

		const searchOptions = {
			filter: domain_search.filter.replace(/#{username}/g, username),
			scope: 'sub'
		};

		logger.search_info('Searching user', username);
		logger.search_debug('searchOptions', searchOptions);
		logger.search_debug('domain_base', self.options.domain_base);

		return self.searchAllSync(self.options.domain_base, searchOptions);
	}

	searchAllAsync(domain_base, options, callback) {
		const self = this;

		self.client.search(domain_base, options, function(error, res) {
			if (error) {
				logger.search_error(error);
				callback(error);
				return;
			}

			res.on('error', function(error) {
				logger.search_error(error);
				callback(error);
				return;
			});

			let entries = [];

			res.on('searchEntry', function(entry) {
				entries.push(entry);
			});

			res.on('end', function(result) {
				logger.search_info('Search result count', entries.length);
				logger.search_debug('Search result', entries);
				callback(null, entries);
			});
		});
	}

	authSync(dn, password) {
		const self = this;

		logger.auth_info('Authenticating', dn);

		try {
			self.bindSync(dn, password);
			logger.auth_info('Authenticated', dn);
			return true;
		} catch(error) {
			logger.auth_info('Not authenticated', dn);
			logger.auth_debug('error', error);
			return false;
		}
	}

	disconnect() {
		const self = this;

		self.connected = false;
		logger.connection_info('Disconecting');
		self.client.unbind();
	}
};
