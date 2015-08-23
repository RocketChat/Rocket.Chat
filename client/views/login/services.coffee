Template.loginServices.helpers
	loginService: ->
		services = []

		authServices = _.pluck ServiceConfiguration.configurations.find({}, { service: 1 }).fetch(), 'service'

		authServices.sort()
		authServices.forEach (service) ->
			switch service
				when 'meteor-developer'
					serviceName = 'Meteor'
					icon = 'meteor'
				when 'github'
					serviceName = 'GitHub'
					icon = 'github-circled'
				when 'gitlab'
					serviceName = 'Gitlab'
					icon = 'git-squared'    # need to replace this with proper logo
				else
					serviceName = _.capitalize service
					icon = service

			services.push
				service: service
				displayName: serviceName
				icon: icon

		return services

Template.loginServices.events
	'click .external-login': (e, t)->
		return unless this.service?

		loadingIcon = $(e.currentTarget).find('.loading-icon')
		serviceIcon = $(e.currentTarget).find('.service-icon')

		loadingIcon.removeClass 'hidden'
		serviceIcon.addClass 'hidden'

		# login with native facebook app
		if Meteor.isCordova and this.service is 'facebook'
			Meteor.loginWithFacebookCordova {}, (error) ->
				loadingIcon.addClass 'hidden'
				serviceIcon.removeClass 'hidden'

				if error
					console.log JSON.stringify(error), error.message
					toastr.error error.message
					return

				FlowRouter.go 'index'
		else
			loginWithService = "loginWith" + (if this.service is 'meteor-developer' then 'MeteorDeveloperAccount' else _.capitalize(this.service))
			serviceConfig = {}
			Meteor[loginWithService] serviceConfig, (error) ->
				loadingIcon.addClass 'hidden'
				serviceIcon.removeClass 'hidden'
				if error
					console.log JSON.stringify(error), error.message
					toastr.error error.message
					return
				FlowRouter.go 'index'
