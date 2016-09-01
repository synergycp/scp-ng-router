(function () {
  'use strict';

  angular
    .module('scp.router.lazyload')
    .constant('APP_REQUIRES', {
      // jQuery based and standalone scripts
      scripts: {},
      // Angular based script (use the right module name)
      modules: [],
    });

})();
