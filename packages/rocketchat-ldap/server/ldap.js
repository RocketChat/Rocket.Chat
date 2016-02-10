const ldapjs = Npm.require('ldapjs');

const logger = new Logger('LDAP', {
	methods: {
		connection_debug: { type: 'debug' },
		connection_error: { type: 'error' }
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
			cacert: RocketChat.settings.get('LDAP_CACert'),
			reject_unauthorized: RocketChat.settings.get('LDAP_Reject_Unauthorized') || false,
			domain_base: RocketChat.settings.get('LDAP_Domain_Base'),
			use_custom_domain_search: RocketChat.settings.get('LDAP_Use_Custom_Domain_Search'),
			custom_domain_search: RocketChat.settings.get('LDAP_Custom_Domain_Search'),
			domain_search_user: RocketChat.settings.get('LDAP_Domain_Search_User'),
			domain_search_password: RocketChat.settings.get('LDAP_Domain_Search_Password'),
			restricted_user_groups: RocketChat.settings.get('LDAP_Restricted_User_Groups'),
			domain_search_user_id: RocketChat.settings.get('LDAP_Domain_Search_User_ID'),
			domain_search_object_class: RocketChat.settings.get('LDAP_Domain_Search_Object_Class'),
			domain_search_object_category: RocketChat.settings.get('LDAP_Domain_Search_Object_Category')
		};

		self.connectSync = Meteor.wrapAsync(self.connectAsync, self);
		self.searchAllSync = Meteor.wrapAsync(self.searchAllAsync, self);
	}

	connectAsync(callback) {
		const self = this;

		logger.connection_debug('Init setup');

		let replied = false;

		const connectinoOptions = {
			url: `${self.options.host}:${self.options.port}`,
			timeout: 1000 * 5,
			connectTimeout: 1000 * 10,
			idleTimeout: 1000 * 10,
			reconnect: false
		};

		const tlsOptions = {
			rejectUnauthorized: self.options.reject_unauthorized
		};

		if (self.options.CACert && self.options.CACert !== '') {
			tlsOptions.ca = [self.options.CACert];
		}

		if (self.options.encryption === 'ssl') {
			connectinoOptions.url = `ldaps://${connectinoOptions.url}`;
			connectinoOptions.tlsOptions = tlsOptions;
		} else {
			connectinoOptions.url = `ldap://${connectinoOptions.url}`;
		}

		logger.connection_debug('Connecting', connectinoOptions);

		self.client = ldapjs.createClient(connectinoOptions);

		self.bindSync = Meteor.wrapAsync(self.client.bind, self.client);

		self.client.on('error', function(error) {
			logger.connection_error('connection', error);
			if (replied === false) {
				replied = true;
				callback(error, null);
			}
		});

		if (self.options.encryption === 'tls') {
			logger.connection_debug('Starting TLS', tlsOptions);

			self.client.starttls(tlsOptions, null, function(error, response) {
				if (error) {
					logger.connection_error('TLS connection', error);
					if (replied === false) {
						replied = true;
						callback(error, null);
					}
					return;
				}

				logger.connection_debug('TLS connected');
				self.connected = true;
				if (replied === false) {
					replied = true;
					callback(null, response);
				}
			});
		} else {
			self.client.on('connect', function(response) {
				logger.connection_debug('connected');
				self.connected = true;
				if (replied === false) {
					replied = true;
					callback(null, response);
				}
			});
		}

		setTimeout(function() {
			if (replied === false) {
				logger.connection_error('connection time out', connectinoOptions.timeout);
				replied = true;
				callback(new Error('Timeout'));
			}
		}, connectinoOptions.timeout);
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
				domain_search_user: custom_domain_search.userDN,
				domain_search_password: custom_domain_search.password
			};
		}

		let filter = ['(&'];

		if (self.options.domain_search_object_category !== '') {
			filter.push(`(objectCategory=${self.options.domain_search_object_category})`);
		}

		if (self.options.domain_search_object_class !== '') {
			filter.push(`(objectclass=${self.options.domain_search_object_class})`);
		}

		if (self.options.restricted_user_groups !== '') {
			filter.push(`(memberOf=${self.options.restricted_user_groups},${self.options.domain_base})`);
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
			domain_search_user: self.options.domain_search_user,
			domain_search_password: self.options.domain_search_password
		};
	}

	bindIfNecessary() {
		const self = this;

		const domain_search = self.getDomainBindSearch();

		if (domain_search.domain_search_user !== '' && domain_search.domain_search_password !== '') {
			console.log('Bind before search', domain_search.domain_search_user, domain_search.domain_search_password);
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

		console.log('LDAP search dn', self.options.domain_base);
		console.log('LDAP search options', searchOptions);

		return self.searchAllSync(self.options.domain_base, searchOptions);
	}

	searchAllAsync(domain_base, options, callback) {
		const self = this;

		self.client.search(domain_base, options, function(error, res) {
			if (error) {
				console.log('LDAP: Search Error', error);
				callback(error);
				return;
			}

			res.on('error', function(error) {
				console.log('LDAP: Search on Error', error);
				callback(error);
				return;
			});

			let entries = [];

			res.on('searchEntry', function(entry) {
				entries.push(entry);
			});

			res.on('end', function(result) {
				console.log('searchAllAsync', entries);
				callback(null, entries);
			});
		});
	}

	authSync(dn, password) {
		const self = this;

		console.log('authSync', dn, password);

		try {
			self.bindSync(dn, password);
			return true;
		} catch(error) {
			return false;
		}
	}

	disconnect() {
		const self = this;

		self.connected = false;
		self.client.unbind();
	}
};
