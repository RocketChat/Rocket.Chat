JedisSettings = function() {
	if (!(this instanceof arguments.callee)) {
		// We were called without `new' operator.
		return new arguments.callee(arguments);
	}

}
/**
 * Load JedisSettings
 defined in settings parameter into underlying collection

 * @param  {Object} settings properties to persist
 * @param  {Boolean} overwrite if true, then overwrite existing values in Collection.  if false, then do not overwrite
 * collection values. 
 * @return {JedisSettings
} this instance 
 */
JedisSettings.prototype.load = function(settings, overwrite) {
	settings = settings || {};
	overwrite = overwrite || false;
	// uses top most property name as key, child object inserted as value.
	_.chain(settings)
		.keys()
		.each(function(key) { 
			var val = settings[key];
			if( overwrite) {
				Settings.upsert(
					{_id : key}, 
					{$set : {value: val}},
					function(error, result) {
						if( error) {
							console.log('Error upsert setting: ' + key + ' with error:' + error.message);
						} else {
					  		console.log('Upsert setting: ' +  key);
					 	}
					});
			} else {
				if( ! Settings.findOne({_id:key}) ) {
					Settings.insert({_id: key, value: val } );
			  		console.log('Insert setting: ' +  key);
				} else {
					console.log('Setting: ' + key + ' already exists.  Skip insert.');
				}
			}
		});

	// make settings accessible via meteor object wihtout having to query collection
	//Meteor.settings = settings; 
	// TODO observe Settings collection for changes and propagate to Meteor.settings object.
	// Look at RocketChat for example.  
	// only the "public" settings will be exposed to the client.  
	//__meteor_runtime_config__.PUBLIC_SETTINGS = Meteor.settings.public; 
};

/**
 * Retrieve the specififed setting's value.  
 * 
 * @param  {String} settingName Name of the setting to retrieve.
 * @return {object} the value associated with the specified settingName.  Undefiened if no value exists
 */
JedisSettings.prototype.get = function(settingName) {
	// assume there's only one associated setting. 
	return Settings.findOne({ _id: settingName }).value;
};
