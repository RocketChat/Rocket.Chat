helpers = share.helpers
compilers = share.compilers
compilers.i18n_json = compilers.generic_compiler('json', helpers.loadJSON)
Plugin.registerSourceHandler "i18n.json", compilers.i18n_json