(function () {
  'use strict';

  angular
    .module('scp.router.lazyload')
    .config(lazyloadConfig);

  /**
   * @ngInject
   */
  function lazyloadConfig($ocLazyLoadProvider, APP_REQUIRES) {

    // Lazy Load modules configuration
    $ocLazyLoadProvider.config({
      debug: false,
      events: true,
      modules: APP_REQUIRES.modules
    });

  }
})();
