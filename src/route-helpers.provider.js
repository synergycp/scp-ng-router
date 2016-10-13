/**=========================================================
 * Module: helpers.js
 * Provides helper functions for routes definition
 =========================================================*/

(function () {
  'use strict';

  angular
    .module('scp.router')
    .provider('RouteHelpers', RouteHelpersProvider);

  /**
   * @ngInject
   */
  function RouteHelpersProvider(APP_REQUIRES, ApiProvider, SsoUrlProvider, UrlProvider, $stateProvider, _) {
    // provider access level
    var RouteHelpersProvider = {
      sso: SsoUrlProvider,
      url: UrlProvider,
      state: $stateProvider.state,
      basepath: basepath,
      themepath: themepath,
      resolveFor: resolveFor,
      dummyTemplate: '<ui-view />',
      package: makePackage,
      $get: makeService,
    };

    return RouteHelpersProvider;

    /**
     * @ngInject
     */
    function makeService($sce, $translateModuleLoader, $translate, Api) {
      var service = _.clone(RouteHelpersProvider);
      service.trusted = trusted;
      service.package = wrappedPackage;
      service.export = makeExport;
      service.loadLang = loadLang;

      return service;

      function loadLang() {
        _.map(arguments, _.ary($translateModuleLoader.addPart, 1));

        return $translate.refresh();
      }

      function trusted(path) {
        return $sce.trustAsResourceUrl(path);
      }

      function wrappedPackage() {
        var pkg = makePackage.apply(null, arguments);

        pkg.trustedAsset = trustedAsset;
        pkg.api = api;

        return pkg;

        function api() {
          return Api.all('pkg').all(pkg.name);
        }

        function trustedAsset(path) {
          return trusted(pkg.asset(path));
        }
      }
    }

    function makeExport(name) {
      return new Export(name);
    }

    function Export(name) {
      var exp = this;
      var url = 'vendor/' + name;

      exp.root = root;
      exp.path = path;

      function root(folder) {
        url = path(folder);

        return exp;
      }

      function path(file) {
        return url + '/' + file;
      }
    }

    function makePackage(name) {
      return new Package(name);
    }

    // Set the base of the relative path for all app views
    function basepath(uri) {
      return 'app/' + uri;
    }

    function themepath(uri) {
      return 'vendor/scp-angle/dist/' + uri;
    }

    function Package(name) {
      var pkg = this;
      var url = 'pkg/' + name + '/';
      var hasBaseState;

      pkg.baseState = 'app.pkg.' + name;

      pkg.name = name;
      pkg.asset = asset;
      pkg.lang = lang;
      pkg.state = state;
      pkg.raw = raw;
      pkg.url = makeUrl;
      pkg.sso = sso;

      function sso(type, callback) {
        function doCallback() {
          var args = _.map(arguments);
          args[0] = wrap$state(args[0]);
          return callback.apply(callback, args);
        }

        SsoUrlProvider.map('pkg.' + name + '.' + type, doCallback);
      }

      function makeUrl(path, callback) {
        function doCallback() {
          var args = _.map(arguments);
          args[0] = wrap$state(args[0]);
          return callback.apply(callback, args);
        }

        UrlProvider.map(url + path, doCallback);

        return pkg;
      }

      function wrap$state(unwrapped$state) {
        var $state = _.clone(unwrapped$state);
        $state.href = href;

        return $state;

        function href() {
          var args = _.map(arguments);

          args[0] = pkg.baseState + '.' + args[0];

          return unwrapped$state.href.apply(unwrapped$state, args);
        }
      }

      function lang(language) {
        return 'lang:pkg:' + name + ':' + language;
      }

      function makeBaseState(opts) {
        $stateProvider.state(
          pkg.baseState,
          _.defaults({}, opts || {}, {
            url: '/'+name,
            abstract: true,
            template: RouteHelpersProvider.dummyTemplate,
          })
        );
      }

      function state(stateName, opts) {
        if (!stateName) {
          makeBaseState(opts);
          return pkg;
        }

        $stateProvider.state(
          pkg.baseState + '.' + stateName,
          opts
        );

        return pkg;
      }

      function asset(path) {
        return ApiProvider.baseUrl() + url + path;
      }

      function raw(path) {
        return 'raw:' + asset(path);
      }
    }

    // Generates a resolve object by passing script names
    // previously configured in constant.APP_REQUIRES
    function resolveFor() {
      var _args = arguments;

      return {
        deps: resolveArgs,
      };

      /**
       * @ngInject
       */
      function resolveArgs(
        $q,
        $timeout,
        $injector,
        $ocLazyLoad,
        RouteHelpers
      ) {
        var lastPromise;

        return $q.all(
          _.map(_args, makePromise)
        );

        // creates promise to chain dynamically
        function makePromise(_arg) {
          var promise = $q.when(_arg);

          // also support a function that returns a promise
          if (typeof _arg === 'function') {
            return promise.then(_arg);
          }

          lastPromise = promise
            .then(loadArg.bind(null, _arg, lastPromise))
            .catch(function (error) {
              console.error('Error loading: ', _arg, error);
            });

          return lastPromise;
        }

        function loadArg(_arg, prevPromise) {
          var split = _arg.split(':');
          var type = split.shift();
          var load = split.join(':');

          switch (type) {
          case 'lang':
            return RouteHelpers.loadLang(load);
          case 'inject':
            return $injector.get(load)();
          case 'raw':
            return $ocLazyLoad.load(load);
          case 'after':
            var promise = prevPromise.then(loadAfter);

            return promise;

            function loadAfter() {
              return loadArg(load, promise);
            }
          }

          // if is a module, pass the name. If not, pass the array
          var whatToLoad = getRequired(_arg);

          // simple error check
          if (!whatToLoad) {
            return $.error(
              'Route resolve: Bad resource name [' + _arg + ']'
            );
          }

          // finally, return a promise
          return $ocLazyLoad.load(whatToLoad);
        }

        // check and returns required data
        // analyze module items with the form [name: '', files: []]
        // and also simple array of script files (for not angular js)
        function getRequired(name) {
          if (APP_REQUIRES.modules) {
            for (var m in APP_REQUIRES.modules) {
              if (APP_REQUIRES.modules[m].name &&
                APP_REQUIRES.modules[m].name === name
              ) {
                return APP_REQUIRES.modules[m];
              }
            }
          }

          return APP_REQUIRES.scripts &&
            APP_REQUIRES.scripts[name];
        }
      }
    }
  }
})();
