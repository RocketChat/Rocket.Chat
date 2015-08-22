Future = Npm.require('fibers/future');
/**
 * This code is largely based on the meteor-accounts-ldap (https://github.com/typ90/meteor-accounts-ldap) 
 * package contributed by Eric Typaldos (https://github.com/typ90)
 * Also based on https://github.com/vesse/node-ldapauth-fork/blob/master/lib/ldapauth.js
 * 
 * requires ldapjs package, meteor add typ:ldapjs
 *
 * This code depends on typ:ldapjs meteor package that wraps the ldpajs node package. 
 * ldapjs client documentation:  http://ldapjs.org/client.html
 */
 DirectoryService = function(config) {

	//  ldapjs configuration options (from documentation):
	//    url - a valid LDAP url.
	//	  socketPath -If you're running an LDAP server over a Unix Domain Socket, use this.
	//    log - You can optionally pass in a bunyan instance the client will use to acquire a logger.
	// 	  	  The client logs all messages at the trace level.
	//    timeout - How long the client should let operations live for before timing out. Default is Infinity.
	//    connectTimeout - How long the client should wait before timing out on TCP connections. Default is up to the OS.
	//    maxConnections - Whether or not to enable connection pooling, and if so, how many to maintain.
	//
	//  If using connection pooling, you can additionally pass in:
    //      bindDN - The DN all connections should be bound as.
    //      bindCredentials	- The credentials to use with bindDN.
    //      checkInterval - How often to schedule health checks.
    //      maxIdleTime - 	How long a client can sit idle before initiating a health check (subject to the 
    //      frequency set by checkInterval).


    // example config
	// var config = {
	// 	url : 'ldap://127.0.0.1:10389',
	// 	userSearchBaseDNTemplate : 'cn={0},ou=Users,dc=jedis,dc=spawar,dc=navy,dc=mil',
    //        admin : {
    //            baseDN : 'cn=manager,dc=jedis,dc=spawar,dc=navy,dc=mil',
    //            credentials : 'swif123',
    //        },
    //        accessDefs : {
    //            baseDN : 'ou=Access,dc=jedis,dc=spawar,dc=navy,dc=mil',
    //            opts : {
    //                filter: '(objectClass=jedis-access-definition)',
    //                scope : 'sub'
    //            }
    //        },
    //        users : {
    //            baseDN : 'ou=Users,dc=jedis,dc=spawar,dc=navy,dc=mil',
    //            opts : {
    //                filter: '(objectClass=jedis-user)',
    //                scope : 'sub'
    //            }
    //        },
    // };
    this.options = {
        // Convert LDAP entry to User object
        // { dn: 'cn=wcleaver,ou=Users,dc=jedis,dc=spawar,dc=navy,dc=mil',
        //   controls: [],
        //   mail: 'wcleaver@jedis.mil',
        //   givenName: 'Wallace',
        //   rank: '13',
        //   phone: '202-555-1212',
        //   location: 'Mayfield',
        //   sn: 'Cleaver',
        //   cn: [ 'Wally Cleaver', 'wcleaver' ],
        //   access: '300',
        //   objectClass:
        //    [ 'top',
        //      'inetOrgPerson',
        //      'person',
        //      'organizationalPerson',
        //      'jedis-user' ],
        //   userPassword: '{SSHA}0aGyWnPVXr7SgZvgJDoeyZQzwflHdUto',
        //   uid: 'wcleaver'  
        //  }
        //  to 
        //  {  profile:
        //     { phone: '202-555-1212',
        //       rank: '8',
        //       location: 'Mayfield',
        //       first_name: 'Theodore',
        //       last_name: 'Cleaver',
        //       access: '300' 
        //     },
        //     _id: 'bcleaver',
        //     username: 'bcleaver',
        //     name : 'Theodore Cleaver',
        //     emails: [{address:'bcleaver@jedis.mil'}]
        //     status: 'offline',
        //     statusConnection: 'offline',
        //     active:true
        //  }
        //   
        userLDAPMap : function( source ) {
            return {
                _id : source.uid,
                username : source.uid,
                name : source.givenName + ' ' + source.sn,
                emails : [
                    {
                        address : source.mail
                    }
                ],
                profile : {
                    phone : source.phone,
                    rank : source.rank,
                    location : source.location,
                    first_name : source.givenName,
                    last_name : source.sn,
                    access : _.isArray(source.access) ? source.access : [source.access],
                },
                status : 'offline',
                statusConnection : 'offline',
                active: true
            }
        },
        accessPermissionLDAPMap : function(source) {
            return {
                _id : source.id,
                trigraph : source.trigraph,
                label: source.description,
                type : source.type
            };
        } 
    };

    _.extend(this.options, config); 
	// Meteor wrapper only calls Npm.require('ldapjs')
	this.ldapjs = MeteorWrapperLdapjs;

    this._adminClient = this.ldapjs.createClient( {
        url: this.options.url,
        maxConnections : 10
    });

    this._adminBound = false;
    this.userClient = this.ldapjs.createClient( {
        url: this.options.url,
        maxConnections : 10
    });
};

DirectoryService.prototype.AuthenticateUser = function(authArgs) {

	var self = this;
	authArgs = authArgs || {};

	var ldapAsyncFut = new Future();

	if ( !authArgs.hasOwnProperty('username') || authArgs.username.length === 0 || 
		!authArgs.hasOwnProperty('jedisPass') || authArgs.jedisPass.length === 0) {
		var argErr = new Meteor.Error(403, 'Missing/Invalid Credentials');
        ldapAsyncFut.return({ error: argErr });
        return ldapAsyncFut.wait();
    };

    var bindDn = self.options.userSearchBaseDNTemplate.replace('{0}',authArgs.username);
    self.userClient.bind(bindDn, authArgs.jedisPass, function(err) {

        try {
            if (err) {
                if( err.name === 'ConnectionError') {
                    console.error('Client ConnectionError URL:' + JSON.stringify(self.userClient.url,null,4));
                    ldapAsyncFut.return({ error : 'Invalid Bind Endpoint'});
                } else if( err.name === 'InvalidCredentialsError') {
                    console.info('InvalidCredentialsError:' + JSON.stringify(err,null,4));
                    ldapAsyncFut.return({ error : 'Invalid Authentication Credentials'});
                } else {
                    console.error('UnexpectedBindError:' + err);
                    ldapAsyncFut.return({ error : 'Unexpected Bind Error:' + err});
                }
            } else {
                var retObject = { user: null 	};
                self.userClient.search(bindDn, {}, function(err, res) {
                    res.on('searchEntry', function(entry) {
                        retObject.user = self.options.userLDAPMap(entry.object);
                    });
                    res.on('end', function() {
                        ldapAsyncFut.return(retObject);           				 
                    });
                });
            }
        } catch (e) {
            ldapAsyncFut.return({ error: e.reason});
        }
    });

    return ldapAsyncFut.wait();
};

/**
 * Returns Users from LDAP.
 * @return unordered array of Users from LDAP
 */
DirectoryService.prototype.getUsers = function( ) {
    var self = this,
        ldapAsyncFut = new Future(),
        userConfig = self.options.users,
        users = [];

    self._search(userConfig.baseDN, userConfig.opts, function (err, result) {
        if( err ) {
            console.error(err);
            throw new Meteor.Error(err);
        } else {

            users = result.map( function(entry) {
                // convert ldap entry to User
                user =  self.options.userLDAPMap(entry);
                return user;

            });
            ldapAsyncFut.return( users );
        }
    })

    return ldapAsyncFut.wait();
}

/**
 * Returns Access permission definitions from LDAP.
 * @return unordered array of Access Permissions from LDAP
 */
DirectoryService.prototype.getAccessPermissions = function( ) {
    var self = this,
        ldapAsyncFut = new Future(),
        accessDefs = self.options.accessDefs,
        permissions = [];

    self._search(accessDefs.baseDN, accessDefs.opts, function (err, result) {
        if( err ) {
            console.error(err);
            throw new Meteor.Error(err);
        } else {
            // Convert array of LDAP entry to Access Permission
            // { dn: 'id=206,ou=Access,dc=jedis,dc=spawar,dc=navy,dc=mil',
            //         controls: [],
            //   id: '206',
            //   objectClass: [Object],
            //   type: 'SCI',
            //   description: 'Private Key',
            //    trigraph: 'PK' 
            //  }
            //  to 
            //  { _id:'206', trigraph:'PK', label:'Private key', type:'SCI'}
            permissions = result.map( function(entry) {
                // convert ldap entry to AccessPermission
                return self.options.accessPermissionLDAPMap(entry);
            });
            ldapAsyncFut.return( permissions );
        }
    })

    return ldapAsyncFut.wait();
}

/**
 * Ensure that `this._adminClient` is bound.
 */
DirectoryService.prototype._adminBind = function (callback) {
    // Anonymous binding
    if (typeof this.options.bindDn === 'undefined' || this.options.bindDn === null) {
        return callback();
    }
    if (this._adminBound) {
        return callback();
    }
    var self = this;
    this._adminClient.bind(this.options.admin.baseDN, this.options.admin.credentials,
        function (err) {
            if (err) {
                self.log && self.log.trace('ldap authenticate: bind error: %s', err);
            return callback(err);
        }
        self._adminBound = true;
        return callback();
    });
};


/**
 * Conduct a search using the admin client. Used for fetching both
 * user and access information.
 *
 * @param searchBase {String} LDAP search base
 * @param options {Object} LDAP search options
 * @param {Function} `function (err, result)`.
 */
DirectoryService.prototype._search = function (searchBase, options, callback) {
    var self = this;

    self._adminBind(function (err) {
        if (err) {
        return callback(err);
        }

        self._adminClient.search(searchBase, options, function (err, result) {
            if (err) {
               return callback(err);
            }

            var items = [];
            result.on('searchEntry', function (entry) {
                items.push(entry.object);
            });

            result.on('error', callback);

            result.on('end', function (result) {
                if (result.status !== 0) {
                    var err = 'non-zero status from LDAP search: ' + result.status;
                    return callback(err);
                }
                return callback(null, items);
            });
        });
    });
};

