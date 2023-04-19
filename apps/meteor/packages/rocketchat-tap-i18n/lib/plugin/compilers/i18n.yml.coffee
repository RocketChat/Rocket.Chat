helpers = share.helpers
compilers = share.compilers
compilers.i18n_yml = compilers.generic_compiler('yml', helpers.loadYAML)
Plugin.registerSourceHandler "i18n.yml", compilers.i18n_yml