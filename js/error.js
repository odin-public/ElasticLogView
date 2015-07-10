(function(angular, _) {
  var err = angular.module('ev.errorhandler', []);


  err.controller('ErrorController', [
    '$routeParams', '$scope',
    function($routeParams, $scope) {
      $scope.code = $routeParams.code;
    }
  ]);
}(angular, _));
