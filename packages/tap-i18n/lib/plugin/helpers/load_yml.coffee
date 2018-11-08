fs = Npm.require 'fs'
YAML = Npm.require 'yamljs'

# loads a yml from file_path
#
# returns undefined if file doesn't exist null if file is empty, parsed content otherwise
_.extend share.helpers,
    loadYAML: (file_path, compileStep=null) ->
      try # use try/catch to avoid the additional syscall to fs.existsSync
        fstats = fs.statSync file_path
      catch
        return undefined

      if fstats.size == 0
      	return null

      try
        content = YAML.load(file_path)
      catch error
        if compileStep?
          compileStep.error
            message: "Can't load `#{file_path}' YAML",
            sourcePath: compileStep._fullInputPath

        throw new Error "Can't load `#{file_path}' YAML"
