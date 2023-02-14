/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 Karl STEIN
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */

Package.describe({
	name: 'jalik:ufs',
	version: '1.0.4',
	author: 'karl.stein.pro@gmail.com',
	summary: 'Base package for UploadFS',
	homepage: 'https://github.com/jalik/jalik-ufs',
	git: 'https://github.com/jalik/jalik-ufs.git',
	documentation: 'README.md',
});

Package.onUse(function (api) {
	api.versionsFrom('2.6.1');
	api.use('check@1.0.7');
	api.use('ecmascript@0.14.0');
	api.use('underscore@1.0.10');
	api.use('matb33:collection-hooks@1.0.1');
	api.use('mongo@1.8.0');
	api.use('webapp@1.8.0', 'server');
	api.mainModule('ufs.js');
});

// eslint-disable-next-line no-undef
Npm.depends({
	'mkdirp': '0.3.5',
	'spark-md5': '3.0.0',
});
