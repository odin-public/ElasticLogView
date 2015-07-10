(function(angular, _, moment) {
  var range = angular.module('ev.range', []);


  range.service('indexRange', [
    function() {
      return function(fromDate, toDate, limit, formatter) {
        function result(arg) {
          if (_.isArray(arg)) {
            return _.map(arg, formatter);
          }

          return [formatter(arg)];
        }

        if (!_.isFunction(formatter)) {
          formatter = function (date) {
            return date.format('YYYY.MM.DD');
          };
        }

        var to, from,
            res = [],
            i = 0;

        if (_.isUndefined(fromDate)) {
          if (_.isUndefined(toDate)) {
            return result(moment());
          } else {
            fromDate = toDate;
          }
        }

        if (_.isUndefined(toDate)) {
          toDate = new Date();
        }

        from = moment(fromDate);
        to = moment(toDate);

        if (from > to) {
          return result(to);
        }

        _.map(['millisecond', 'second', 'minute', 'hour'], function (f) {
          to[f](0);
          from[f](0);
        });

        do {
          res.push(formatter(to));
          to.subtract(1, 'day');
        } while (from.diff(to) <= 0 && ++i < limit);

        return res;
      };
    }
  ]);
}(angular, _, moment));
