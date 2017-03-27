/* globals LDAP:true, LDAPJS */
/* exported LDAP */

const ldapjs = LDAPJS;

const logger = new Logger('LDAP', {
	sections: {
		connection: 'Connection',
		bind: 'Bind',
		search: 'Search',
		auth: 'Auth'
	}
});

LDAP = class LDAP {
	constructor() {
		const self = this;

		self.ldapjs = ldapjs;

		self.connected = false;

		self.options = {
			host: RocketChat.settings.get('LDAP_Host'),
			port: RocketChat.settings.get('LDAP_Port'),
			connect_timeout: RocketChat.settings.get('LDAP_Connect_Timeout'),
			idle_timeout: RocketChat.settings.get('LDAP_Idle_Timeout'),
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
			domain_search_object_category: RocketChat.settings.get('LDAP_Domain_Search_Object_Category'),
			group_filter_enabled: RocketChat.settings.get('LDAP_Group_Filter_Enable'),
			group_filter_object_class: RocketChat.settings.get('LDAP_Group_Filter_ObjectClass'),
			group_filter_group_id_attribute: RocketChat.settings.get('LDAP_Group_Filter_Group_Id_Attribute'),
			group_filter_group_member_attribute: RocketChat.settings.get('LDAP_Group_Filter_Group_Member_Attribute'),
			group_filter_group_member_format: RocketChat.settings.get('LDAP_Group_Filter_Group_Member_Format'),
			group_filter_group_name: RocketChat.settings.get('LDAP_Group_Filter_Group_Name')
		};

		self.connectSync = Meteor.wrapAsync(self.connectAsync, self);
		self.searchAllSync = Meteor.wrapAsync(self.searchAllAsync, self);
	}

	connectAsync(callback) {
		const self = this;

		logger.connection.info('Init setup');

		let replied = false;

		const connectionOptions = {
			url: `${ self.options.host }:${ self.options.port }`,
			timeout: 1000 * 60 * 10,
			connectTimeout: self.options.connect_timeout,
			idleTimeout: self.options.idle_timeout,
			reconnect: false
		};

		const tlsOptions = {
			rejectUnauthorized: self.options.reject_unauthorized
		};

		if (self.options.ca_cert && self.options.ca_cert !== '') {
			// Split CA cert into array of strings
			const chainLines = RocketChat.settings.get('LDAP_CA_Cert').split('\n');
			let cert = [];
			const ca = [];
			chainLines.forEach(function(line) {
				cert.push(line);
				if (line.match(/-END CERTIFICATE-/)) {
					ca.push(cert.join('\n'));
					cert = [];
				}
			});
			tlsOptions.ca = ca;
		}

		if (self.options.encryption === 'ssl') {
			connectionOptions.url = `ldaps://${ connectionOptions.url }`;
			connectionOptions.tlsOptions = tlsOptions;
		} else {
			connectionOptions.url = `ldap://${ connectionOptions.url }`;
		}

		logger.connection.info('Connecting', connectionOptions.url);
		logger.connection.debug('connectionOptions', connectionOptions);

		self.client = ldapjs.createClient(connectionOptions);

		self.bindSync = Meteor.wrapAsync(self.client.bind, self.client);

		self.client.on('error', function(error) {
			logger.connection.error('connection', error);
			if (replied === false) {
				replied = true;
				callback(error, null);
			}
		});

		if (self.options.encryption === 'tls') {

			// Set host parameter for tls.connect which is used by ldapjs starttls. This shouldn't be needed in newer nodejs versions (e.g v5.6.0).
			// https://github.com/RocketChat/Rocket.Chat/issues/2035
			// https://github.com/mcavage/node-ldapjs/issues/349
			tlsOptions.host = self.options.host;

			logger.connection.info('Starting TLS');
			logger.connection.debug('tlsOptions', tlsOptions);

			self.client.starttls(tlsOptions, null, function(error, response) {
				if (error) {
					logger.connection.error('TLS connection', error);
					if (replied === false) {
						replied = true;
						callback(error, null);
					}
					return;
				}

				logger.connection.info('TLS connected');
				self.connected = true;
				if (replied === false) {
					replied = true;
					callback(null, response);
				}
			});
		} else {
			self.client.on('connect', function(response) {
				logger.connection.info('LDAP connected');
				self.connected = true;
				if (replied === false) {
					replied = true;
					callback(null, response);
				}
			});
		}

		setTimeout(function() {
			if (replied === false) {
				logger.connection.error('connection time out', connectionOptions.timeout);
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
			} catch (error) {
				throw new Error('Invalid Custom Domain Search JSON');
			}

			return {
				filter: custom_domain_search.filter,
				domain_search_user: custom_domain_search.userDN || '',
				domain_search_password: custom_domain_search.password || ''
			};
		}

		const filter = ['(&'];

		if (self.options.domain_search_object_category !== '') {
			filter.push(`(objectCategory=${ self.options.domain_search_object_category })`);
		}

		if (self.options.domain_search_object_class !== '') {
			filter.push(`(objectclass=${ self.options.domain_search_object_class })`);
		}

		if (self.options.domain_search_filter !== '') {
			filter.push(`(${ self.options.domain_search_filter })`);
		}

		const domain_search_user_id = self.options.domain_search_user_id.split(',');
		if (domain_search_user_id.length === 1) {
			filter.push(`(${ domain_search_user_id[0] }=#{username})`);
		} else {
			filter.push('(|');
			domain_search_user_id.forEach((item) => {
				filter.push(`(${ item }=#{username})`);
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

		if (self.domainBinded === true) {
			return;
		}

		const domain_search = self.getDomainBindSearch();

		if (domain_search.domain_search_user !== '' && domain_search.domain_search_password !== '') {
			logger.bind.info('Binding admin user', domain_search.domain_search_user);
			self.bindSync(domain_search.domain_search_user, domain_search.domain_search_password);
			self.domainBinded = true;
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

		logger.search.info('Searching user', username);
		logger.search.debug('searchOptions', searchOptions);
		logger.search.debug('domain_base', self.options.domain_base);

		return self.searchAllSync(self.options.domain_base, searchOptions);
	}

	getUserByIdSync(id, attribute) {
		const self = this;

		self.bindIfNecessary();

		const Unique_Identifier_Field = RocketChat.settings.get('LDAP_Unique_Identifier_Field').split(',');

		let filter;

		if (attribute) {
			filter = new self.ldapjs.filters.EqualityFilter({
				attribute,
				value: new Buffer(id, 'hex')
			});
		} else {
			const filters = [];
			Unique_Identifier_Field.forEach(function(item) {
				filters.push(new self.ldapjs.filters.EqualityFilter({
					attribute: item,
					value: new Buffer(id, 'hex')
				}));
			});

			filter = new self.ldapjs.filters.OrFilter({filters});
		}

		const searchOptions = {
			filter,
			scope: 'sub'
		};

		logger.search.info('Searching by id', id);
		logger.search.debug('search filter', searchOptions.filter.toString());
		logger.search.debug('domain_base', self.options.domain_base);

		const result = self.searchAllSync(self.options.domain_base, searchOptions);

		if (!Array.isArray(result) || result.length === 0) {
			return;
		}

		if (result.length > 1) {
			logger.search.error('Search by id', id, 'returned', result.length, 'records');
		}

		return result[0];
	}

	getUserByUsernameSync(username) {
		const self = this;

		self.bindIfNecessary();

		const domain_search = self.getDomainBindSearch();

		const searchOptions = {
			filter: domain_search.filter.replace(/#{username}/g, username),
			scope: 'sub'
		};

		logger.search.info('Searching user', username);
		logger.search.debug('searchOptions', searchOptions);
		logger.search.debug('domain_base', self.options.domain_base);

		const result = self.searchAllSync(self.options.domain_base, searchOptions);

		if (!Array.isArray(result) || result.length === 0) {
			return;
		}

		if (result.length > 1) {
			logger.search.error('Search by username', username, 'returned', result.length, 'records');
		}

		return result[0];
	}

	isUserInGroup(username) {
		const self = this;

		if (!self.options.group_filter_enabled) {
			return true;
		}

		const filter = ['(&'];

		if (self.options.group_filter_object_class !== '') {
			filter.push(`(objectclass=${ self.options.group_filter_object_class })`);
		}

		if (self.options.group_filter_group_member_attribute !== '') {
			filter.push(`(${ self.options.group_filter_group_member_attribute }=${ self.options.group_filter_group_member_format })`);
		}

		if (self.options.group_filter_group_id_attribute !== '') {
			filter.push(`(${ self.options.group_filter_group_id_attribute }=${ self.options.group_filter_group_name })`);
		}
		filter.push(')');

		const searchOptions = {
			filter: filter.join('').replace(/#{username}/g, username),
			scope: 'sub'
		};

		logger.search.debug('Group filter LDAP:', searchOptions.filter);

		const result = self.searchAllSync(self.options.domain_base, searchOptions);

		if (!Array.isArray(result) || result.length === 0) {
			return false;
		}
		return true;
	}


	searchAllAsync(domain_base, options, callback) {
		const self = this;

		self.client.search(domain_base, options, function(error, res) {
			if (error) {
				logger.search.error(error);
				callback(error);
				return;
			}

			res.on('error', function(error) {
				logger.search.error(error);
				callback(error);
				return;
			});

			const entries = [];
			const jsonEntries = [];

			res.on('searchEntry', function(entry) {
				entries.push(entry);
				jsonEntries.push(entry.json);
			});

			res.on('end', function(/*result*/) {
				logger.search.info('Search result count', entries.length);
				logger.search.debug('Search result', JSON.stringify(jsonEntries, null, 2));
				callback(null, entries);
			});
		});
	}

	authSync(dn, password) {
		const self = this;

		logger.auth.info('Authenticating', dn);

		try {
			self.bindSync(dn, password);
			logger.auth.info('Authenticated', dn);
			return true;
		} catch (error) {
			logger.auth.info('Not authenticated', dn);
			logger.auth.debug('error', error);
			return false;
		}
	}

	disconnect() {
		const self = this;

		self.connected = false;
		logger.connection.info('Disconecting');
		self.client.unbind();
	}
};
