helpers = share.helpers
compilers = share.compilers
compiler_configuration = share.compiler_configuration

schema = new SimpleSchema
  translation_function_name:
    type: String
    defaultValue: "__"
    label: "Translation Function Name"
    optional: true
  helper_name:
    type: String
    defaultValue: "_"
    label: "Helper Name"
    optional: true
  namespace:
    type: String
    defaultValue: null
    label: "Translations Namespace"
    optional: true

compilers.package_tap_i18n = (compileStep) ->
  compiler_configuration.registerInputFile(compileStep)
  input_path = compileStep._fullInputPath

  if helpers.isPackage(compileStep)
    compileStep.error
      message: "More than one package-tap.i18n found for package: #{compileStep.packageName}",
      sourcePath: input_path
    return

  if helpers.isProjectI18nLoaded(compileStep)
    compileStep.error
      message: "Can't compile package-tap.i18n if project-tap.i18n is present",
      sourcePath: input_path
    return

  if helpers.isDefaultProjectConfInserted(compileStep)
    compileStep.error
      message: "package-tap.i18n should be loaded before languages files (*.i18n.json)",
      sourcePath: input_path
    return

  helpers.markAsPackage(compileStep)

  package_tap_i18n = helpers.loadJSON input_path, compileStep

  if not package_tap_i18n?
    package_tap_i18n = schema.clean {}
  schema.clean package_tap_i18n

  try
    check package_tap_i18n, schema
  catch error
    compileStep.error
      message: "File `#{file_path}' is an invalid package-tap.i18n file (#{error})",
      sourcePath: input_path
    return

  package_name = compileStep.packageName

  if not package_tap_i18n.namespace?
    package_tap_i18n.namespace = package_name

  namespace = package_tap_i18n.namespace

  package_i18n_js_file =
    """
    TAPi18n.packages["#{package_name}"] = #{JSON.stringify(package_tap_i18n)};

    // define package's translation function (proxy to the i18next)
    #{package_tap_i18n.translation_function_name} = TAPi18n._getPackageI18nextProxy("#{namespace}");

    """

  if compileStep.archMatches "web"
    package_i18n_js_file +=
      """
      // define the package's templates registrar
      registerI18nTemplate = TAPi18n._getRegisterHelpersProxy("#{package_name}");
      registerTemplate = registerI18nTemplate; // XXX OBSOLETE, kept for backward compatibility will be removed in the future

      // Record the list of templates prior to package load
      var _ = Package.underscore._;
      non_package_templates = _.keys(Template);

      """

  compileStep.addJavaScript
    path: "package-i18n.js",
    sourcePath: input_path,
    data: package_i18n_js_file,
    bare: false

Plugin.registerSourceHandler "package-tap.i18n", compilers.package_tap_i18n