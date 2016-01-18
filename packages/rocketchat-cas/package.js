Package.describe({
  name: "rocketchat:cas",
  summary: "CAS support for accounts",
  version: "1.0.0",
  git: "https://github.com/rocketchat/rocketchat-cas"
});

Package.onUse(function(api) {

  api.versionsFrom('1.1.0.2');

  // Server libs
  api.use('rocketchat:lib', 'server');
  api.use('service-configuration', 'server');
 
  // Server files
  api.add_files('cas_rocketchat.js', 'server');
});

