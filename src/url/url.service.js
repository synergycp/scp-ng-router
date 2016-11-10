(function () {
  'use strict';

  angular
    .module('scp.router.url')
    .provider('Url', makeUrlProvider)
    ;

  /**
   * @ngInject
   */
  function makeUrlProvider() {
    var mappings = [];
    var baseState;
    var UrlProvider = {
      $get: makeService,
      map: map,
      getBaseState: getBaseState,
      setBaseState: setBaseState,
    };

    return UrlProvider;

    function getBaseState() {
      return baseState;
    }

    function setBaseState(state) {
      baseState = state;
    }

    /**
     * @ngInject
     */
    function makeService(_, $state) {
      return new UrlService(_, $state, UrlProvider, mappings);
    }

    function map(apiUrl, callback) {
      mappings.push(new Mapping(apiUrl, callback));
    }
  }

  /**
   * Url Service
   *
   * @ngInject
   */
  function UrlService (_, $state, UrlProvider, mappings) {
    var Url = this;
    var baseUrl;

    Url.get = get;
    Url.map = UrlProvider.map;

    //////////

    function get(apiUrl) {
      return _.reduce(mappings, reduceResult, null) ||
        unknown(apiUrl)
        ;

      function reduceResult (result, mapping) {
        return result || getMappingResult(mapping, apiUrl);
      }
    }

    function getMappingResult(mapping, apiUrl) {
      var result = mapping.result(apiUrl, $state);

      if (!result) {
        return;
      }

      return getBaseUrl()+result;
    }

    function getBaseUrl() {
      return (baseUrl = baseUrl ||
        $state.href(
          getBaseStateOrFail()
        )
      );
    }

    function getBaseStateOrFail() {
      return UrlProvider.getBaseState() || noBaseState();
    }

    function noBaseState() {
      throw new Error('No base state set in UrlProvider.');
    }

    function unknown(apiUrl) {
      console.warning('URL does not match any known URLs: ' + apiUrl);
    }
  }

  function Mapping(url, callback) {
    var mapping = this;
    var re = new RegExp(url);

    mapping.result = result;

    /////////

    function result(apiUrl, $state) {
      var matches = apiUrl.match(re);

      if (!matches) {
        return;
      }

      matches.shift();
      matches.unshift($state);

      var result = callback.apply(mapping, matches);

      if (result && result.charAt(0) === '#') {
        result = result.substring(1);
      }

      return result;
    }
  }
})();
