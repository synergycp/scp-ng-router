(function () {
  'use strict';

  angular
    .module('scp.router')
    .config(configRouter)
  ;

  /**
   * @ngInject
   */
  function configRouter($locationProvider) {
    $locationProvider.hashPrefix('');
  }
})();
