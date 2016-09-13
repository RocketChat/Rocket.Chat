Meteor.startup ->
    RocketChat.settings.addGroup 'Phone', ->
        @add 'Phone_Enabled', false, { type: 'boolean', public: true }
        @add 'Phone_WSS', false, { type: 'string', public: true }
