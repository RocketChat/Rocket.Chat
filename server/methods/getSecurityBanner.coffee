Meteor.methods
	getSecurityBanner: (permissionIds) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] getSecurityBanner -> Invalid user")

		banner = {}

		perms = new Jedis.AccessPermission permissionIds 
			.toArray();

		systemCountryCode = Jedis.accessManager.getPermissions(Jedis.settings.get('public').system.countryCode)

		if systemCountryCode.length is 0
			console.log 'System country not found.  Defaulting to USA'
			systemCountryCode = _id: '300', trigraph: 'USA', label: 'United States', type: 'Release Caveat'
		else
			systemCountryCode = systemCountryCode[0];
		


		# Obtain classification, add to banner. If none, default: 'UNCLASSIFIED'
		classification = _.chain perms
			.filter (perm) -> return perm.type is 'classification'
			# there should only be a single classification label
			.first()
			# if no classification then default to unclassified
			.value() || _id : 'U', label : 'UNCLASSIFIED'


		# get all sci and sap labels, sort separately by trigraph
		# join trigraphs separated by ' / ''
		sciLabels = _.chain perms
			.filter (perm) -> return perm.type is 'SCI'
			.pluck 'trigraph'
			.sort()
			.value()
		sapLabels = _.chain perms
			.filter (perm) -> return perm.type is 'SAP'
			.pluck 'trigraph'
			.sort()
			.value()
		sciSapLabels = _.flatten [sciLabels, sapLabels]
			.join ' / '


		# get all rel-to countries, add to banner with ', ' separator
		# if none specified (or only 'USA'), default to 'NOFORN'
		reltoLabels = _.chain perms
			.filter (perm) -> return perm.type is 'Release Caveat'
			# exclude system country code because we prepend later as first country
			.reject (perm) -> return perm._id is systemCountryCode._id
			.pluck 'trigraph'
			.sort()
			.value()
		# if still contains entries, hard-code system country code at front else 'NOFORN'
		reltoLabels.splice(0, 0, ( if reltoLabels.length > 0 then 'REL TO ' + systemCountryCode.trigraph else 'NOFORN'))
		reltoLabels = reltoLabels.join ', '


		# stitch everything together
		banner.classificationId = classification._id
		banner.text = _.compact [classification.label.toUpperCase(), sciSapLabels, reltoLabels]
			.join ' // '

		return banner