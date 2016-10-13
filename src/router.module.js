(function () {
  'use strict';

  angular
    .module('scp.router', [
      'ui.router',
      'oc.lazyLoad',
      'ct.ui.router.extras',

      'scp.core.auth',

      'scp.router.lazyload',
      'scp.router.url',
    ]);
})();
