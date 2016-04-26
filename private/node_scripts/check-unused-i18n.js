var fs = require('fs');
var path = require('path');
var _ = require('underscore');

var contents = fs.readFileSync(__dirname + '/../../packages/rocketchat-lib/i18n/en.i18n.json', 'utf-8');
var keys = _.keys(JSON.parse(contents));
// var keys = _.keys(JSON.parse(contents)).filter(function(key) { return ['_Description', '_male', '_female', 'theme-color-'].every(function(word) { return key.indexOf(word) === -1; }); });
var keysFound = [];

function inspectFile(key, contents) {
	if (contents && contents.indexOf(key) !== -1) {
		return true;
	}
}

function ignoreFunc(file) {
	if (['/.meteor/', '/node_modules/', '/moment-locales/'].some(function(word) { return file.indexOf(word) !== -1; })) {
		return true;
	}
	var ext = path.extname(file);
	return ext !== '.coffee' && ext !== '.js' && ext !== '.html';
}

var walk = function(dir, done) {
	var results = [];
	fs.readdir(dir, function(err, list) {
		if (err) {
			return done(err);
		}
		var pending = list.length;
		if (!pending) {
			return done(null, results);
		}
		list.forEach(function(file) {
			file = path.resolve(dir, file);
			fs.stat(file, function(err, stat) {
				if (stat && stat.isDirectory()) {
					walk(file, function(err, res) {
						results = results.concat(res);
						if (!--pending) {
							done(null, results);
						}
					});
				} else {
					if (!ignoreFunc(file)) {
						results.push(file);
					}
					if (!--pending) {
						done(null, results);
					}
				}
			});
		});
	});
};

walk(__dirname + '/../..', function(err, files) {
	if (err) {
		throw err;
	}
	files.forEach(function(file) {
		contents = fs.readFileSync(file, 'utf-8');
		var searchKeys = _.difference(keys, keysFound);
		searchKeys.forEach(function(key) {
			if (inspectFile(key, contents)) {
				keysFound.push(key);
			}
		});
	});
	console.log(_.difference(keys, keysFound));
});
