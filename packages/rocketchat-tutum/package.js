Package.describe({
    name: 'rocketchat:tutum',
    version: '0.0.1',
    summary: 'RocketChat tutum integration'
});

Package.onUse(function(api) {
    api.versionsFrom('1.0');
    api.use('coffeescript');

    api.addFiles('startup.coffee', 'server');
});

Npm.depends({
    'redis': '2.2.5'
});

Package.onTest(function(api) {

});
