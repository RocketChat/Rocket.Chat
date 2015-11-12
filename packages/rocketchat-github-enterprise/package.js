Package.describe({
    name: 'rocketchat:github-enterprise',
    version: '0.0.1',
    summary: 'RocketChat settings for GitHub Enterprise Oauth Flow'
});

Package.onUse(function(api) {
    api.versionsFrom('1.0');

    api.use('coffeescript');
    api.use('rocketchat:lib@0.0.1');
    api.use('rocketchat:custom-oauth');

    api.addFiles('startup.coffee', 'server');
    api.addFiles('github-enterprise-login-button.css', 'client');
    api.addFiles('common.coffee');

	// TAPi18n
    api.use('templating', 'client');
    var _ = Npm.require('underscore');
    var fs = Npm.require('fs');
    tapi18nFiles = _.compact(_.map(fs.readdirSync('packages/rocketchat-github-enterprise/i18n'), function(filename) {
        if (fs.statSync('packages/rocketchat-github-enterprise/i18n/' + filename).size > 16) {
            return 'i18n/' + filename;
        }
    }));
    api.use('tap:i18n@1.6.1', ['client', 'server']);
    api.imply('tap:i18n');
    api.addFiles(tapi18nFiles, ['client', 'server']);

});

Package.onTest(function(api) {

});
