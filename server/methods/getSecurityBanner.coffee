Meteor.methods
	getSecurityBanner: (permissionIds) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] getSecurityBanner -> Invalid user")

		banner = {};

		perms = new Jedis.AccessPermission(permissionIds).toArray();

		# TODO: get code from settings when implemented
		systemCountryCode = { _id: '300', trigraph: 'USA', label: 'United States', type: 'Release Caveat' };


		# Obtain classification, add to banner. If none, default: 'UNCLASSIFIED'
		classification = _.chain(perms)
			.filter( function(perm) {return perm.type === 'classification'})
			# there should only be a single classification label
			.first()
			# if no classification then default to unclassified
			.value() || {_id : 'U', label : 'UNCLASSIFIED'};
			# TODO: should this also specify trigraph, type for completeness?


		# get all sci and sap labels, sort separately by trigraph
		# join trigraphs separated by ' / ''
		sciLabels = _.chain(perms)
			.filter( function(perm) { return perm.type === 'SCI'})
			.pluck( 'trigraph')
			.sort()
			.value();
		sapLabels = _.chain(perms)
			.filter( function(perm) { return perm.type === 'SAP'})
			.pluck( 'trigraph')
			.sort()
			.value();
		sciSapLabels = _.flatten([sciLabels, sapLabels]).join(' / ');


		# get all rel-to countries, add to banner with ', ' separator
		# if none specified (or only 'USA'), default to 'NOFORN'
		reltoLabels = _.chain(perms)
			.filter( function(perm) { return perm.type === 'Release Caveat'})
			// exclude system country code because we prepend later as first country
			.reject( function(perm) { return perm._id === systemCountryCode._id} ) 
			.pluck( 'trigraph' )
			.sort()
			.value();
		# if still contains entries, hard-code system country code at front else 'NOFORN'
		reltoLabels.splice(0, 0, (reltoLabels.length > 0 ? 'REL TO ' + systemCountryCode.trigraph : 'NOFORN'));
		reltoLabels = reltoLabels.join(', ');

		banner.classificationId = classification._id;
		banner.text = _.compact([classification.label, sciSapLabels, reltoLabels]).join(' // ');

		return banner;