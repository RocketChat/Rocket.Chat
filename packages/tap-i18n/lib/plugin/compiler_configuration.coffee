# Note: same compiler can be used to compile more then one package (at least in v0.9.x)

share.compiler_configuration =
  fallback_language: globals.fallback_language
  packages: [] # Each time we compile package-tap.i18n we push "package_name:arch" to this array
  templates_registered_for: [] # Each time we register a template we push "package_name:arch" to this array
  default_project_conf_inserted_for: [] # Keeps track of the archs we've inserted the default project conf for.
                                        # Default project conf is inserted by the *.i18.json compiler to be used
                                        # in case the project has no project-tap.i18n
  project_tap_i18n_loaded_for: [] # Keeps track of the archs we've loaded project_tap_i18n for

  tap_i18n_input_files: []
  registerInputFile: (compileStep) ->
    input_file = "#{compileStep.arch}:#{compileStep._fullInputPath}"
    if input_file in @tap_i18n_input_files
      # A new build cycle
      @packages = []
      @templates_registered_for = []
      @default_project_conf_inserted_for = []
      @project_tap_i18n_loaded_for = []
      @tap_i18n_input_files = []

    @tap_i18n_input_files.push(input_file)
