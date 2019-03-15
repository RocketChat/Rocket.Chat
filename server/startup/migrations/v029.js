import { Migrations } from '/app/migrations';
import { Settings } from '/app/models';

Migrations.add({
	version: 29,
	up() {
		let LDAP_Url = (Settings.findOne('LDAP_Url') || {}).value;
		const LDAP_TLS = (Settings.findOne('LDAP_TLS') || {}).value;
		const LDAP_DN = (Settings.findOne('LDAP_DN') || {}).value;
		const LDAP_Bind_Search = (Settings.findOne('LDAP_Bind_Search') || {}).value;

		if (LDAP_Url && LDAP_Url.trim() !== '') {
			LDAP_Url = LDAP_Url.replace(/ldaps?:\/\//i, '');
			Settings.upsert({ _id: 'LDAP_Host' }, {
				$set: {
					value: LDAP_Url,
				},
				$setOnInsert: {
					createdAt: new Date,
				},
			});
		}

		if (LDAP_TLS === true) {
			Settings.upsert({ _id: 'LDAP_Encryption' }, {
				$set: {
					value: 'tls',
				},
				$setOnInsert: {
					createdAt: new Date,
				},
			});
		}

		if (LDAP_DN && LDAP_DN.trim() !== '') {
			Settings.upsert({ _id: 'LDAP_Domain_Base' }, {
				$set: {
					value: LDAP_DN,
				},
				$setOnInsert: {
					createdAt: new Date,
				},
			});

			Settings.upsert({ _id: 'LDAP_Username_Field' }, {
				$set: {
					value: '',
				},
				$setOnInsert: {
					createdAt: new Date,
				},
			});

			Settings.upsert({ _id: 'LDAP_Unique_Identifier_Field' }, {
				$set: {
					value: '',
				},
				$setOnInsert: {
					createdAt: new Date,
				},
			});
		}

		if (LDAP_Bind_Search && LDAP_Bind_Search.trim() !== '') {
			Settings.upsert({ _id: 'LDAP_Custom_Domain_Search' }, {
				$set: {
					value: LDAP_Bind_Search,
				},
				$setOnInsert: {
					createdAt: new Date,
				},
			});

			Settings.upsert({ _id: 'LDAP_Use_Custom_Domain_Search' }, {
				$set: {
					value: true,
				},
				$setOnInsert: {
					createdAt: new Date,
				},
			});
		}

		Settings.remove({ _id: 'LDAP_Url' });
		Settings.remove({ _id: 'LDAP_TLS' });
		Settings.remove({ _id: 'LDAP_DN' });
		Settings.remove({ _id: 'LDAP_Bind_Search' });
	},
});
