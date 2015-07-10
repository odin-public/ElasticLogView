(function(angular, _) {
  var app = angular.module('elasticview', ['elasticsearch', 'ngRoute', 'angularSpinner',
                                           'ui.bootstrap', 'luegg.directives',
                                           'angular-loading-bar',
                                           'ev.config', 'ev.eswrapper', 'ev.statemanager',
                                           'ev.range', 'ev.sharelink', 'ev.errorhandler']);


  app.service('es', [
    'esFactory', 'config',
    function(esFactory, config) {
      return esFactory({
        host: config.esHost,
        apiVersion: config.apiVersion
      });
    }]);


  app.config(['usSpinnerConfigProvider', function (usSpinnerConfigProvider) {
    usSpinnerConfigProvider.setDefaults({
      lines: 13,
      length: 3,
      width: 2,
      radius: 4
    });
  }]);


  app.service('runAggregations', [
    'es', 'aggregate', 'config', 'state',
    function(es, aggregate, config, state) {
      return function() {
        _.map(config.filters, function(filter, filterPos) {
          var aggs = {},
              term = {};

          term[config.baseFilterField] = state.baseFilter();

          aggs[filter.field + 's'] = {
            terms: {
              field: filter.field + '.raw'
            }
          };

          aggregate(aggs, term).then(function(result) {
            console.log(result);
            state.termsFilter(filter, result.aggregations[filter.field + 's'].buckets, filterPos);
          });
        });
      };
    }
  ]);


  app.filter('padr', function() {
    return function(input, padding) {
      if (!padding || !input) {
        return input;
      }

      var append = padding - input.length;

      if (append > 0) {
        return input + Array(append).join(' ');
      }

      return input;
    };
  });


  app.directive('evUuid', [
    'config',
    function(config) {
      return {
        require: 'ngModel',
        link: function(scope, elm, attrs, ctrl) {
          ctrl.$parsers.unshift(function(viewValue) {
            if (config.baseFilterValidator(viewValue)) {
              ctrl.$setValidity('uuid', true);

              return viewValue;
            }

            ctrl.$setValidity('uuid', false);
            return undefined;
          });
        }
      };
    }
  ]);


  app.directive('selectOnClick', function () {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        element.on('click', function () {
          if (!window.getSelection().toString()) {
            // Required for mobile Safari
            this.setSelectionRange(0, this.value.length);
          }
        });
      }
    };
  });


  app.config([
    '$routeProvider',
    function($routeProvider) {
      $routeProvider.
      when('/:baseFilter', {
        templateUrl: 'templates/log.html',
        controller: 'MainViewURLController'
      }).
      when('/', {
        templateUrl: 'templates/landing.html',
        controller: 'LandingController'
      }).
      when('/l/:id', {
        resolve: {
          savedParams: 'getSavedParams'
        }
      }).
      when('/error/:code', {
        templateUrl: 'templates/error.html',
        controller: 'ErrorController'
      }).
      otherwise({
        redirectTo: '/'
      });
    }
  ]);


  app.controller('NavbarController', [
    '$scope', '$modal', 'state', 'config',
    function($scope, $modal, state, config) {
      $scope.baseFilter = state.baseFilter;
      $scope.autorefresh = state.autorefresh;

      $scope.toggleFilters = function() {
        var v = state.hideFilters();
        state.hideFilters(!v);
      };
    }
  ]);


  app.controller('SidebarController', [
    '$scope', 'config', 'runAggregations', 'state', '$modal',
    function($scope, config, runAggregations, state, $modal) {
      $scope.filters = state.filters;
      $scope.hideFilters = function() {
        return state.hideFilters() ? 'hidden' : '';
      };
      $scope.recordCount = state.count;
      $scope.allowedSizes = config.allowedSizes;

      $scope.fromSet = state.dateFromFilterSet;
      $scope.toSet = state.dateToFilterSet;
      $scope.from = state.dateFromFilter;
      $scope.to = state.dateToFilter;
    }
  ]);


  app.controller('MainViewURLController', [
    '$routeParams', 'state', 'config',
    function($routeParams, state, config) {
      var baseFilter = config.baseFilterValidator($routeParams.baseFilter);

      if (baseFilter) {
        state.valid(true);
      } else {
        return;
      }

      _.mapObject($routeParams, function(value, key) {
        var keyFilter = _.findWhere(config.filters, {field: key});

        if (!_.isUndefined(keyFilter)) {
          var position = config.filters.indexOf(keyFilter);

          state.hasURLFilters(key, true);

          state.termsFilter(keyFilter, _.map(value.split(','), function(k) {
            return {
              key: k,
              doc_count: 0
            };
          }), position);
        } else {
          switch (key) {
            case 'baseFilter': state.baseFilter(baseFilter); break;
            case 'from': state.dateFromFilter(new Date(value)); break;
            case 'to': state.dateToFilter(new Date(value)); break;

            case 'autorefresh': state.autorefresh(value.toString() === 'true'); break;
            case 'hideFilters': state.hideFilters(value.toString() === 'true'); break;
            case 'size': state.count(parseInt(value, 10)); break;

            default: console.warn("Ignoring unknown URL parameter", key); break;
          }
        }
      });
    }
  ]);


  app.controller('QueryController', [
    '$scope', 'es', 'config', 'search', 'state', 'runAggregations',
    function($scope, es, config, search, state, runAggregations) {
      var isAutorefreshEnabled;

      $scope.items = [{type: '_notready'}];
      $scope.logFields = config.logFields;

      $scope.autorefresh = function(val) {
        if (!val) {
          isAutorefreshEnabled = state.autorefresh();
          state.autorefresh(false);
        } else if (isAutorefreshEnabled) {
          state.autorefresh(true);
        }
      };

      $scope.onFilterShow = function(shown, hidden) {
        return state.hideFilters() ? hidden : shown;
      };

      function esSearch() {
        var query = {
          bool: {
            must: []
          }
        };

        addBaseFilter(state, query);
        addTimeFilters(state, query);
        addTermFilters(state, query);

        return search(query);
      }

      function processAndGetMore(error, response) {
        response = error || response;

        state.timeout(function() {
          if (state.autorefresh()) {
            main();
          }
        }, config.refreshInterval);

        console.log(response);

        if (state.autorefresh() || !$scope.items.length) {
          if (response.hits.hits.length < state.count()) {
            $scope.items.splice(0, state.count() - response.hits.hits.length);
          }

          if ($scope.items.length > state.count()) {
            $scope.items.splice(0, $scope.items.length - state.count());
          }

          response.hits.hits.forEach(function(item, i) {
            $scope.items[i] = item._source;
          });

          if (!state.intro) {
            showIntro(config.intro, config.introVersion);
            state.intro = true;
          }
        }
      }

      function main() {
        esSearch().then(processAndGetMore);
        runAggregations();
      }

      $scope.$watch(
        function() {
          return state.autorefresh();
        },
        function(newValue, oldValue) {
          if (newValue !== oldValue && newValue) {
            main();
          }
        }
      );

      if (state.valid()) {
        main();
      }
    }
  ]);


  app.controller('LandingController', [
    '$scope',
    function($scope) {
      $scope.baseFilter = '';
    }
  ]);


  app.service('getSavedParams', [
    'sharedlink', '$route', '$location',
    function(sharedlink, $route, $location) {
      var stateId = $route.current.params.id,
          state, baseFilter;

      return sharedlink(stateId).then(function(res) {
        if (res.hits.total === 1) {
          state = res.hits.hits[0]._source;

          baseFilter = state.baseFilter;
          delete state.baseFilter;

          $location.path('/' + baseFilter);
          _.mapObject(state, function(v, k) {
            $location.search(k, v);
          });
        } else {
          $location.path('/error/404');
        }
      }, function(err) {
        console.log(err);
      });
    }
  ]);


  function addTimeFilters(state, query) {
    if (state.dateToFilterSet() || state.dateFromFilterSet()) {
      var ts, range;

      range = {
        range: {
          '@timestamp': {}
        }
      };

      ts = range.range['@timestamp'];

      if (state.dateFromFilterSet()) {
        ts.gt = state.dateFromFilter().getTime();
      }

      if (state.dateToFilterSet()) {
        ts.lt = state.dateToFilter().getTime();
      }

      query.bool.must.push(range);
    }
  }


  function addBaseFilter(state, query) {
    var term = {};

    term[state.config.baseFilterField] = state.baseFilter();

    query.bool.must.push({
      term: term
    });
  }


  function addTermFilters(state, query) {
    function genFilterQuery(filters) {
      return _(filters)
        .filter(
        function(filter) {
          return !_.isUndefined(filter);
        })
        .map(
        function(filter) {
          var res = {};

          if (filter.toggles.length) {
            res[filter.field + '.raw'] = _(_(filter.toggles).where({checked: true})).pluck('key');

            return {
              terms: res
            };
          }
        })
        .filter(
        function(res) {
          return !_.isUndefined(res);
        });
    }

    Array.prototype.push.apply(query.bool.must, genFilterQuery(state.filters));
  }


  function showIntro(steps, introVersion) {
    if (_.isEmpty(steps) || window.localStorage['intro_' + introVersion]) {
      return;
    }

    var intro = introJs();

    function shown() {
      window.localStorage.setItem('intro_' + introVersion, new Date());
    }

    intro.setOptions({
      steps: steps,
      showStepNumbers: false
    });

    intro.onexit(shown);
    intro.oncomplete(shown);

    intro.start();
  }
}(angular, _));
