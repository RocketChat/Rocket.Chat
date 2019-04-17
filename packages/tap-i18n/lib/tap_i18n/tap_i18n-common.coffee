fallback_language = globals.fallback_language

TAPi18n = ->
  EventEmitter.call @

  @_fallback_language = fallback_language

  @_language_changed_tracker = new Tracker.Dependency

  @_loaded_languages = [fallback_language] # stores the loaded languages, the fallback language is loaded automatically

  @conf = null # If conf isn't null we assume that tap:i18n is enabled for the project.
             # We assume conf is valid, we sterilize and validate it during the build process.

  @packages = {} # Stores the packages' package-tap.i18n jsons

  @languages_names = {} # Stores languages that we've found languages files for in the project dir.
                                      # format:
                                      # {
                                      #    lang_tag: [lang_name_in_english, lang_name_in_local_language]
                                      # }

  @translations = {} # Stores the packages/project translations - Server side only
                   # fallback_language translations are not stored here


  if Meteor.isClient
    Session.set @_loaded_lang_session_key, null

    @_languageSpecificTranslators = {}
    @_languageSpecificTranslatorsTrackers = {}

  if Meteor.isServer
    @server_translators = {}

    Meteor.startup =>
      # If tap-i18n is enabled for that project
      if @_enabled()
        @_registerHTTPMethod()

  @__ = @_getPackageI18nextProxy(globals.project_translations_domain)

  TAPi18next.setLng fallback_language

  return @

Util.inherits TAPi18n, EventEmitter

_.extend TAPi18n.prototype,
  _loaded_lang_session_key: "TAPi18n::loaded_lang"

  _enable: (conf) ->
    # tap:i18n gets enabled for a project once a conf file is set for it.
    # It can be either a conf object that was set by project-tap.i18n file or
    # a default conf, which is being added if the project has lang files
    # (*.i18n.json) but not project-tap.i18n
    @conf = conf

    @._onceEnabled()

  _onceEnabled: () ->
    # The arch specific code can use this for procedures that should be performed once
    # tap:i18n gets enabled (project conf file is being set)
    return

  _enabled: ->
    # read the comment of @conf
    @conf?

  _getPackageDomain: (package_name) ->
    package_name.replace(/:/g, "-")

  addResourceBundle: (lang_tag, package_name, translations) ->
    TAPi18next.addResourceBundle(lang_tag, @_getPackageDomain(package_name), translations)

  _getSpecificLangTranslator: (lang) ->
    current_lang = TAPi18next.lng()

    translator = null
    TAPi18next.setLng lang, {fixLng: true}, (lang_translator) =>
      translator = lang_translator

    # Restore i18next lang that had been changed in the process of generating
    # lang specific translator
    TAPi18next.setLng current_lang

    return translator

  _getProjectLanguages: () ->
    # Return an array of languages available for the current project
    if @._enabled()
      if _.isArray @.conf.supported_languages
        return _.union([@._fallback_language], @.conf.supported_languages)
      else
        # If supported_languages is null, all the languages we found
        # translations files to in the project level are considered supported.
        # We use the @.languages_names array to tell which languages we found
        # since for every i18n.json file we found in the project level we add
        # an entry for its language to @.languages_names in the build process.
        #
        # We also know for certain that when tap-i18n is enabled the fallback
        # lang is in @.languages_names
        return _.keys @.languages_names
    else
      return [@._fallback_language]

  getLanguages: ->
    if not @._enabled()
      return null

    languages = {}
    for lang_tag in @._getProjectLanguages()
      languages[lang_tag] =
        name: @.languages_names[lang_tag][1]
        en: @.languages_names[lang_tag][0]

    languages

  _loadLangFileObject: (language_tag, data) ->
    for package_name, package_keys of data
      # Translations that are added by loadTranslations() have higher priority
      package_keys = _.extend({}, package_keys, @_loadTranslations_cache[language_tag]?[package_name] or {})

      @addResourceBundle(language_tag, package_name, package_keys)

  _loadTranslations_cache: {}
  loadTranslations: (translations, namespace) ->
    project_languages = @_getProjectLanguages()

    for language_tag, translation_keys of translations
      if not @_loadTranslations_cache[language_tag]?
        @_loadTranslations_cache[language_tag] = {}

      if not @_loadTranslations_cache[language_tag][namespace]?
        @_loadTranslations_cache[language_tag][namespace] = {}

      _.extend(@_loadTranslations_cache[language_tag][namespace], translation_keys)

      @addResourceBundle(language_tag, namespace, translation_keys)

      if Meteor.isClient and @getLanguage() == language_tag
        # Retranslate if session language updated
        @_language_changed_tracker.changed()