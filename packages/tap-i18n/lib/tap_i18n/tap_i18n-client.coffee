_.extend TAPi18n.prototype,
  _languageSpecificTranslators: null
  _languageSpecificTranslatorsTrackers: null

  _getLanguageFilePath: (lang_tag) ->
    if not @_enabled()
      return null

    path = if @.conf.cdn_path? then @.conf.cdn_path else @.conf.i18n_files_route
    path = path.replace /\/$/, ""
    if Meteor.isCordova and path[0] == "/"
      path = Meteor.absoluteUrl().replace(/\/+$/, "") + path

    "#{path}/#{lang_tag}.json"

  _loadLanguage: (languageTag) ->
    # Load languageTag and its dependencies languages to TAPi18next if we
    # haven't loaded them already.
    #
    # languageTag dependencies languages are:
    # * The base language if languageTag is a dialect.
    # * The fallback language (en) if we haven't loaded it already.
    #
    # Returns a deferred object that resolves with no arguments if all files
    # loaded successfully to TAPi18next and rejects with array of error
    # messages otherwise
    #
    # Example:
    # TAPi18n._loadLanguage("pt-BR")
    #   .done(function () {
    #     console.log("languageLoaded successfully");
    #   })
    #   .fail(function (messages) {
    #     console.log("Couldn't load languageTag", messages);
    #   })
    #
    # The above example will attempt to load pt-BR, pt and en

    dfd = new $.Deferred()

    if not @_enabled()
      return dfd.reject "tap-i18n is not enabled in the project level, check tap-i18n README"

    project_languages = @_getProjectLanguages()

    if languageTag in project_languages
      if languageTag not in @_loaded_languages
        loadLanguageTag = =>
          jqXHR = $.getJSON(@_getLanguageFilePath(languageTag))

          jqXHR.done (data) =>
            @_loadLangFileObject(languageTag, data)

            @_loaded_languages.push languageTag

            dfd.resolve()

          jqXHR.fail (xhr, error_code) =>
            dfd.reject("Couldn't load language '#{languageTag}' JSON: #{error_code}")

        directDependencyLanguageTag = if "-" in languageTag then languageTag.replace(/-.*/, "") else fallback_language

        # load dependency language if it is part of the project and not the fallback language
        if languageTag != fallback_language and directDependencyLanguageTag in project_languages
          dependencyLoadDfd = @_loadLanguage directDependencyLanguageTag

          dependencyLoadDfd.done =>
            # All dependencies loaded successfully
            loadLanguageTag()

          dependencyLoadDfd.fail (message) =>
            dfd.reject("Loading process failed since dependency language
              '#{directDependencyLanguageTag}' failed to load: " + message)
        else
          loadLanguageTag()
      else
        # languageTag loaded already
        dfd.resolve()
    else
      dfd.reject(["Language #{languageTag} is not supported"])

    return dfd.promise()

  _registerHelpers: (package_name, template) ->
    if package_name != globals.project_translations_domain
      tapI18nextProxy = @_getPackageI18nextProxy(@packages[package_name].namespace)
    else
      tapI18nextProxy = @_getPackageI18nextProxy(globals.project_translations_domain)

    underscore_helper = (key, args...) ->
      options = (args.pop()).hash
      if not _.isEmpty(args)
        options.sprintf = args

      tapI18nextProxy(key, options)

    # template specific helpers
    if package_name != globals.project_translations_domain
      # {{_ }}
      if Template[template]? and Template[template].helpers?
        helpers = {}
        helpers[@packages[package_name].helper_name] = underscore_helper
        Template[template].helpers(helpers)

    # global helpers
    else
      # {{_ }}
      UI.registerHelper @conf.helper_name, underscore_helper

      # {{languageTag}}
      UI.registerHelper "languageTag", () => @getLanguage()

    return
      
  _getRegisterHelpersProxy: (package_name) ->
    # A proxy to _registerHelpers where the package_name is fixed to package_name
    (template) =>
      @_registerHelpers(package_name, template)

  _prepareLanguageSpecificTranslator: (lang_tag) ->
    dfd = (new $.Deferred()).resolve().promise()

    if lang_tag of @_languageSpecificTranslatorsTrackers
      return dfd

    @_languageSpecificTranslatorsTrackers[lang_tag] = new Tracker.Dependency

    if not(lang_tag of @_languageSpecificTranslators)
      dfd = @_loadLanguage(lang_tag)
        .done =>
          @_languageSpecificTranslators[lang_tag] = @_getSpecificLangTranslator(lang_tag)

          @_languageSpecificTranslatorsTrackers[lang_tag].changed()

    return dfd

  _getPackageI18nextProxy: (package_name) ->
    # A proxy to TAPi18next.t where the namespace is preset to the package's

    (key, options, lang_tag=null) =>
      # Devs get confused and use lang option instead of lng option, make lang
      # alias of lng
      if options?.lang? and not options?.lng?
        options.lng = options.lang

      if options?.lng? and not lang_tag?
        lang_tag = options.lng
        # Remove options.lng so we won't pass it to the regular TAPi18next
        # before the language specific translator is ready to keep behavior
        # consistent.
        #
        # If lang is actually ready before the language specifc translator is
        # ready, TAPi18next will translate to lang_tag if we won't remove
        # options.lng.
        delete options.lng

      if lang_tag?
        @_prepareLanguageSpecificTranslator(lang_tag)

        @_languageSpecificTranslatorsTrackers[lang_tag].depend()

        if lang_tag of @_languageSpecificTranslators
          return @_languageSpecificTranslators[lang_tag] "#{TAPi18n._getPackageDomain(package_name)}:#{key}", options
        else
          return TAPi18next.t "#{TAPi18n._getPackageDomain(package_name)}:#{key}", options

      # If inside a reactive computation, we want to invalidate the computation if the client lang changes
      @_language_changed_tracker.depend()


      TAPi18next.t "#{TAPi18n._getPackageDomain(package_name)}:#{key}", options

  _onceEnabled: () ->
    @_registerHelpers globals.project_translations_domain

  _abortPreviousSetLang: null
  setLanguage: (lang_tag) ->
    self = @

    @_abortPreviousSetLang?()

    isAborted = false
    @_abortPreviousSetLang = -> isAborted = true
    
    @_loadLanguage(lang_tag).then =>
      if not isAborted
        TAPi18next.setLng(lang_tag)

        @_language_changed_tracker.changed()
        Session.set @_loaded_lang_session_key, lang_tag

  getLanguage: ->
    if not @._enabled()
      return null

    session_lang = Session.get @_loaded_lang_session_key

    if session_lang? then session_lang else @._fallback_language
