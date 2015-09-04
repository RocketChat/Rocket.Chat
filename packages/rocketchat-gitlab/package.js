Package.describe({
    name: 'rocketchat:gitlab',
    version: '0.0.1',
    summary: 'RocketChat settings for GitLab Oauth Flow'
});

// Loads all i18n.json files into tapi18nFiles
var _ = Npm.require('underscore');
var fs = Npm.require('fs');
tapi18nFiles = fs.readdirSync('packages/rocketchat-gitlab/i18n').forEach(function(filename) {
    if (fs.statSync('packages/rocketchat-gitlab/i18n/' + filename).size > 16) {
        return 'i18n/' + filename;
    }
});

Package.onUse(function(api) {
    api.versionsFrom('1.0');

    api.use("tap:i18n@1.5.1");
    api.use('coffeescript');
    api.use('rocketchat:lib@0.0.1');
    api.use('rocketchat:custom-oauth');

    api.use('templating', 'client');


    api.addFiles("package-tap.i18n");
    api.addFiles("common.coffee");
    api.addFiles(tapi18nFiles);

    api.addFiles('gitlab-login-button.css', 'client');

    api.addFiles('startup.coffee', 'server');
});

Package.onTest(function(api) {

});
