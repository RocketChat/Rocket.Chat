var path = Npm.require('path');
var fs = Npm.require('fs');

Package.describe({
  summary: 'Contains all your npm dependencies',
  version: '1.2.0',
  name: 'npm-container'
});

var packagesJsonFile = path.resolve('./packages.json');
try {
  var fileContent = fs.readFileSync(packagesJsonFile);
  var packages = JSON.parse(fileContent.toString());
  Npm.depends(packages);
} catch (ex) {
  console.error('ERROR: packages.json parsing error [ ' + ex.message + ' ]');
}

// Adding the app's packages.json as a used file for this package will get
// Meteor to watch it and reload this package when it changes
Package.onUse(function(api) {
  api.addFiles('index.js', 'server');
  if (api.addAssets) {
    api.addAssets('../../packages.json', 'server');
  } else {
    api.addFiles('../../packages.json', 'server', {
      isAsset: true
    });
  }
});