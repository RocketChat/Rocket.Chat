path = Npm.require "path"

compilers = share.compilers

Plugin.registerSourceHandler "i18n", (compileStep) ->
  # Starting from Meteor v1.2 registerSourceHandler doesn't
  # accept filenames as handlers.
  # See: https://github.com/meteor/meteor/issues/3985
  # and: https://github.com/TAPevents/tap-i18n/issues/113
  # Below is a workaround until we refactor for v1.2 new
  # build plugin API.
  file_name = _.last compileStep.inputPath.split(path.sep)

  if file_name == "package-tap.i18n"
    compilers.package_tap_i18n(compileStep)

  if file_name == "project-tap.i18n"
    compilers.project_tap_i18n(compileStep)
