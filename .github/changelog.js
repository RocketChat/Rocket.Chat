/* eslint no-var: 0, object-shorthand: 0, prefer-template: 0 */

'use strict';
var readFile = require('fs').readFileSync;
var resolve = require('path').resolve;
var gitUrl = 'https://github.com/RocketChat/Rocket.Chat';

var parserOpts = {
	headerPattern: /^(\[([A-z]+)\] )?(.*)$/m,
	headerCorrespondence: [
		'stype',
		'type',
		'subject'
	],
	mergePattern: /^Merge pull request #(.*) from .*$/,
	mergeCorrespondence: ['pr']
	// noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES'],
	// revertPattern: /^revert:\s([\s\S]*?)\s*This reverts commit (\w*)\./,
	// revertCorrespondence: ['header', 'hash'],
	// mergePattern: /^Merge pull request #(\d+) from (.*)$/,
	// mergeCorrespondence: ['id', 'source']
};

var LABELS = {
	BREAK: {
		title: 'BREAKING CHANGES',
		collapse: false
	},
	NEW: {
		title: 'New Features',
		collapse: false
	},
	FIX: {
		title: 'Bug Fixes',
		collapse: false
	},
	DOC: {
		title: 'Documentation',
		collapse: true
	},
	OTHER: {
		title: 'Others',
		collapse: true
	}
};

var sort = Object.keys(LABELS);

var writerOpts = {
	transform: function(commit) {
		if (!commit.pr) {
			return;
		}

		// console.log(commit);
		commit.type = (commit.type || 'OTHER').toUpperCase();
		if (LABELS[commit.type] == null) {
			return;
		}

		commit.pr_url = gitUrl + '/pull/' + commit.pr;

		var issues = [];

		if (typeof commit.hash === 'string') {
			commit.hash = commit.hash.substring(0, 7);
		}

		if (typeof commit.subject === 'string') {
			// GitHub issue URLs.
			commit.subject = commit.subject.replace(/#([0-9]+)/g, function(_, issue) {
				issues.push(issue);
				return '[#' + issue + '](' + gitUrl + '/issues/' + issue + ')';
			});
			// GitHub user URLs.
			commit.subject = commit.subject.replace(/@([a-zA-Z0-9_]+)/g, '[@$1](https://github.com/$1)');
		}

		// remove references that already appear in the subject
		commit.references = commit.references.filter(function(reference) {
			if (issues.indexOf(reference.issue) === -1) {
				return true;
			}

			return false;
		});

		return commit;
	},
	groupBy: 'type',
	commitGroupsSort: function(a, b) {
		return sort.indexOf(a.title) > sort.indexOf(b.title);
	},
	finalizeContext: function(context) {
		context.commitGroups.forEach(function(group) {
			Object.assign(group, LABELS[group.title.toUpperCase()]);
		});

		// console.log(context);
		return context;
	},
	commitsSort: ['subject']
};

writerOpts.mainTemplate = readFile(resolve(__dirname, 'templates/template.hbs'), 'utf-8');
writerOpts.headerPartial = readFile(resolve(__dirname, 'templates/header.hbs'), 'utf-8');
writerOpts.commitPartial = readFile(resolve(__dirname, 'templates/commit.hbs'), 'utf-8');
writerOpts.footerPartial = readFile(resolve(__dirname, 'templates/footer.hbs'), 'utf-8');

module.exports = {
	gitRawCommitsOpts: {
		merges: null
	},
	parserOpts: parserOpts,
	writerOpts: writerOpts
};
