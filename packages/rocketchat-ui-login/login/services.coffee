Meteor.startup ->
	ServiceConfiguration.configurations.find({custom: true}).observe
		added: (record) ->
			new CustomOAuth record.service,
				serverURL: record.serverURL
				authorizePath: record.authorizePath

Template.loginServices.helpers
	loginService: ->
		services = []

		authServices = ServiceConfiguration.configurations.find({}, { sort: {service: 1} }).fetch()

		authServices.forEach (service) ->
			switch service.service
				when 'meteor-developer'
					serviceName = 'Meteor'
					icon = 'meteor'
				when 'github'
					serviceName = 'GitHub'
					icon = 'github-circled'
				when 'gitlab'
					serviceName = 'GitLab'
					icon = service.service
				when 'wordpress'
					serviceName = 'WordPress'
					icon = service.service
				else
					serviceName = _.capitalize service.service
					icon = service.service

			services.push
				service: service
				displayName: serviceName
				icon: icon

		return services

Template.loginServices.events
	'click .external-login': (e, t)->
		return unless this.service?.service?

		loadingIcon = $(e.currentTarget).find('.loading-icon')
		serviceIcon = $(e.currentTarget).find('.service-icon')

		loadingIcon.removeClass 'hidden'
		serviceIcon.addClass 'hidden'

		# login with native facebook app
		if Meteor.isCordova and this.service.service is 'facebook'
			Meteor.loginWithFacebookCordova {}, (error) ->
				loadingIcon.addClass 'hidden'
				serviceIcon.removeClass 'hidden'

				if error
					console.log JSON.stringify(error)
					if error.reason
						toastr.error error.reason
					else
						toastr.error error.message
					return

		else
			loginWithService = "loginWith" + (if this.service.service is 'meteor-developer' then 'MeteorDeveloperAccount' else _.capitalize(this.service.service))
			serviceConfig = this.service.clientConfig or {}
			Meteor[loginWithService] serviceConfig, (error) ->
				loadingIcon.addClass 'hidden'
				serviceIcon.removeClass 'hidden'
				if error
					console.log JSON.stringify(error)
					if error.reason
						toastr.error error.reason
					else
						toastr.error error.message
					return
