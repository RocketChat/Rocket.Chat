# codex-blackboard-hubot-scripts

Meteor doesn't interact really well with NPM and the NPM module
loading mechanism which hubot uses for its scripts.  So we've
split out most of hubot's scripts into this separate module.

To add a new hubot script:

* **If it is packaged in npm** (probably via the
[hubot-scripts organization on github](https://github.com/hubot-scripts)),
just add it to the `package.json`, for example with:
```
$ npm install --save hubot-pugme
```

* **If it is included in the old [hubot-scripts repository](https://github.com/github/hubot-scripts/tree/master/src/scripts)**,
just add it to the `hubot-scripts.json` file.  For example:
```
["redis-brain.coffee", "shipit.coffee", "whatis.coffee", "<new-script-name>.coffee"]
```

* **If it is a custom script**, or a forked/tweaked version of a
  script, add it to the `scripts/` directory.
