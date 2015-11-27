Meteor.startup ->
  Migrations.add
    version: 22
    up: ->
      RocketChat.models.Settings.remove { _id: 'Accounts_denyUnverifiedEmails' }
      console.log 'Deleting not used setting Accounts_denyUnverifiedEmails'
