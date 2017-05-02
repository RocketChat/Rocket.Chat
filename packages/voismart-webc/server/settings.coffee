Meteor.startup ->
    RocketChat.settings.addGroup 'WebCollaboration', ->
        @add 'Webc_Enabled', false, { type: 'boolean', public: true }
        @add 'Webc_Server', '', { type: 'string', public: true }
        @add 'Webc_Domain', '', { type: 'string', public: true }
        @add 'Webc_Username', '', { type: 'string', public: true }
        @add 'Webc_Password', '', { type: 'string', public: true }
        @add 'Webc_PhoneNumber', '', { type: 'string', public: true }
