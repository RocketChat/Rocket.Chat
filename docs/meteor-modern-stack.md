# Meteor's Modern Build Stack

We now use Meteor's [Modern Build Stack](https://docs.meteor.com/about/modern-build-stack.html) to build and run the project. This is a set of components that improve the building process as a whole, with better speed and new features and plugin support.

## Issues with File Watching

The modern stack uses [@parcel/watcher](https://github.com/parcel-bundler/watcher) to watch for file changes. This is a module that supports multiple watcher backends and will use the best option available, following this priority order:

- `FSEvents` on macOS
- `Watchman` if installed
- `inotify` on Linux
- `ReadDirectoryChangesW` on Windows
- `kqueue` on FreeBSD, or as an alternative to FSEvents on macOS

However, Watchman seems to [have a problem with Meteor's file structure](https://forums.meteor.com/t/modern-watcher-had-failed-to-start-watcher-for-error-message/63830) and it might not work properly.

If you ever had to build our ReactNative app, you likely have watchman installed on your computers. And so, if you're not using a Mac, the modern stack may fail to build and/or watch files. In this case, your options are:

1. Uninstalling watchman
2. Disabling Meteor's modern watcher on the package.json file:

```
	"meteor": {
		"modern": {
			"watcher": false
		}
	},
```

### Additional Issues with TurboRepo

TurboRepo has an issue where the subprocesses it spawns are not always terminated along with the parent process. You may have noticed this before, as you often need to hit Ctrl+C twice to completely shutdown all processes. When Watchman is used as the watcher backend, this TurboRepo issue is aggravated and you now need to kill the watchman and node processes manually any time you want to stop the Rocket.Chat server. 

TurboRepo has [just recently released](https://github.com/vercel/turborepo/pull/12607) an improvement related to this, but we have not updated to it yet.
