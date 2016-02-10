Meteor.startup(function(){
    RocketChat.settings.addGroup('CAS', function() {
        this.add("CAS_enabled", false, { type: 'boolean', group: 'CAS'});
        this.add("CAS_base_url" , '' , { type: 'string' , group: 'CAS' });
        this.add("CAS_login_url" , '' , { type: 'string' , group: 'CAS' });

        this.section('CAS Login Layout', function() {
            this.add("CAS_popup_width" , '810' , { type: 'string' , group: 'CAS'});
            this.add("CAS_popup_height" , '610' , { type: 'string' , group: 'CAS'});
            this.add("CAS_button_label_text" , 'CAS' , { type: 'string' , group: 'CAS'});
            this.add("CAS_button_label_color", '#FFFFFF' , { type: 'color' , group: 'CAS'});
            this.add("CAS_button_color" , '#13679A' , { type: 'color' , group: 'CAS'});
            this.add("CAS_autoclose", true , { type: 'boolean' , group: 'CAS'});
        });
    });
});
    
timer = undefined

function updateServices(record) { 
    if( typeof timer != 'undefined' ) {
        Meteor.clearTimeout(timer);
    }

    timer = Meteor.setTimeout(function() {
        console.log("Updating login service CAS".blue)
        data = {
            // These will pe passed to 'node-cas' as options
            enabled:          RocketChat.settings.get("CAS_enabled"),
            base_url:         RocketChat.settings.get("CAS_base_url"),
            login_url:        RocketChat.settings.get("CAS_login_url"),
            // Rocketchat Visuals
            buttonLabelText:  RocketChat.settings.get("CAS_button_label_text"),
            buttonLabelColor: RocketChat.settings.get("CAS_button_label_color"),
            buttonColor:      RocketChat.settings.get("CAS_button_color"),
            width:            RocketChat.settings.get("CAS_popup_width"),
            height:           RocketChat.settings.get("CAS_popup_height"),
            autoclose:        RocketChat.settings.get("CAS_autoclose"),
        };

        // Either register or deregister the CAS login service based upon its configuration
        if( data.enabled ) {
            ServiceConfiguration.configurations.upsert({service: 'cas'}, { $set: data });
            // Export needed settings for meteor-accounts-cas here
            Meteor.settings.public.cas = { loginUrl: data.login_url };
            Meteor.settings.cas = { baseUrl: data.base_url };
        } else {
            ServiceConfiguration.configurations.remove({service: 'cas'});
            Meteor.settings.public.cas = {};
            Meteor.settings.cas = {};
        }
    }, 2000);
};

function check_record (record) {
    if( /^CAS_.+/.test( record._id )){
        updateServices( record );
    }
};

RocketChat.models.Settings.find().observe({
    added: check_record,
    changed: check_record,
    removed: check_record
});
