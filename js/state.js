(function(angular, _) {
  var state = angular.module('ev.statemanager', ['ev.config']);


  state.factory('state', [
    '$timeout', 'config', 'indexRange',
    function($timeout, config, indexRange) {
      var API, state = {
        filters: [],
        dateFilter: {
          from: {
            date: new Date(),
            set: false
          },
          to: {
            date: new Date(),
            set: false
          }
        },
        count: config.esSize,
        autorefresh: true,
        hideFilters: false,
        valid: false,
        timeoutPromise: null,
        intro: false,
        baseFilter: '',
        hasURLFilters: {}
      };

      function baseFilter(v) {
        if (!_.isUndefined(v)) {
          state.baseFilter = v;
        }

        return state.baseFilter;
      }

      function hasURLFilters(key, v) {
        if (!_.isUndefined(v)) {
          state.hasURLFilters[key] = v;
        }

        return state.hasURLFilters[key];
      }

      function dateFilter(dir, date) {
        if (!_.isUndefined(date)) {
          state.dateFilter[dir].date = date;
          dateFilterSet(dir, true);
        }

        return state.dateFilter[dir].date;
      }

      function dateFilterSet(dir, set) {
        if (!_.isUndefined(set)) {
          state.dateFilter[dir].set = Boolean(set);
        }

        return state.dateFilter[dir].set;
      }

      function autorefresh(val) {
        if (!_.isUndefined(val)) {
          state.autorefresh = val;

          if (!val && state.timeoutPromise) {
            $timeout.cancel(state.timeoutPromise);
          }
        }

        return state.autorefresh;
      }

      function valid(v) {
        if (!_.isUndefined(v)) {
          state.valid = v;
        }

        return state.valid;
      }

      function hideFilters(v) {
        if (!_.isUndefined(v)) {
          state.hideFilters = v;
        }

        return state.hideFilters;
      }

      function timeout(func, delay) {
        if (!_.isUndefined(state.timeoutPromise)) {
          $timeout.cancel(state.timeoutPromise);
        }

        state.timeoutPromise = $timeout(func, delay);
      }

      function count(v) {
        if (!_.isUndefined(v)) {
          if (v > 1000) {
            v = 1000;
          } else if (v <= 0) {
            v = 1;
          }

          state.count = v;
        }

        return state.count;
      }

      function termsFilter(configFilter, values, position) {
        var filter = _.findWhere(state.filters, {field: configFilter.field});

        function Toggle(key, count, checked) {
          count = (_.isUndefined(count) ? 0 : count);
          checked = (_.isUndefined(checked) ? false : checked);

          this.key = key;
          this.count = count;
          this.checked = checked;
        }

        function filterKey(viewFunc, key) {
          var k;

          if (_.isFunction(viewFunc)) {
            k = viewFunc(key);
          } else {
            k = key;
          }

          return k;
        }

        if (_.isUndefined(filter)) {
          filter = {
            field: configFilter.field,
            cssClass: configFilter.cssClass,
            caption: configFilter.caption,

            toggles: _.map(values, function(f) {
              return new Toggle(filterKey(configFilter.view, f.key), f.doc_count, true);
            })
          };

          state.filters[position] = filter;
        } else {
          _.map(values, function(f) {
            var toggle = _.findWhere(filter.toggles, {key: f.key});

            if (_.isUndefined(toggle)) {
              var initialState = true;

              if (hasURLFilters(configFilter.field)) {
                initialState = false;
              }

              filter.toggles.push(new Toggle(f.key, f.doc_count, initialState));
            } else {
              toggle.count = f.doc_count;
            }
          });
        }
      }

      function index() {
        var indexRe = /^(.*)\[(.*?)\](.*)$/,
            parts = indexRe.exec(config.indexPattern),
            date = [''],
            dateFrom, dateTo;

        var datePattern = parts[2],
            prefix = parts[1],
            suffix = parts[3];

        if (datePattern) {
          if (dateFilterSet('from')) {
            dateFrom = dateFilter('from');
          }

          if (dateFilterSet('to')) {
            dateTo = dateFilter('to');
          }

          date = indexRange(
            dateFrom, dateTo, config.indexDaysBack,
            function(date) {
              return date.format(datePattern);
            });
        }

        return _.map(date, function(d) {
          return prefix + d + suffix;
        }).join(',');
      }

      function serialize() {
        if (API.valid()) {
          var s;

          s = _.omit(state,
                     ['hasURLFilters', 'intro', 'timeoutPromise',
                      'filters', 'valid', 'dateFilter', 'count']);

          _.map(state.filters, function(f) {
            s[f.field] = _.chain(f.toggles)
              .where({checked: true})
              .pluck('key')
              .values()
              .value()
              .join(',');
          });

          if (API.dateToFilterSet()) {
            s.to = API.dateToFilter();
          }

          if (API.dateFromFilterSet()) {
            s.from = API.dateFromFilter();
          }

          return s;
        }
      }

      function deserialize(obj) {
        var toggles = obj.toggles;

        delete obj.toggles;

        state = _.extend(state, obj);
      }

      API = {
        filters: state.filters,
        termsFilter: termsFilter,
        dateFromFilter: _.partial(dateFilter, 'from'),
        dateFromFilterSet: _.partial(dateFilterSet, 'from'),
        dateToFilter: _.partial(dateFilter, 'to'),
        dateToFilterSet: _.partial(dateFilterSet, 'to'),
        autorefresh: autorefresh,
        hideFilters: hideFilters,
        valid: valid,
        timeout: timeout,
        count: count,
        intro: state.intro,
        baseFilter: baseFilter,
        index: index,
        config: config,
        hasURLFilters: hasURLFilters,
        serialize: serialize,
        deserialize: deserialize
      };

      return API;
    }]);
}(angular, _));
