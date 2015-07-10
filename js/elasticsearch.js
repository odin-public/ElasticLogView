(function(angular, _) {
  var es = angular.module('ev.eswrapper', ['ev.config', 'ev.statemanager']);


  es.service('search', [
    'es', 'config', 'state',
    function(es, config, state) {
      return function(query) {
        if (state.valid()) {
          return es.search({
            index: state.index(),
            size: state.count(),
            body: {
              query: query,
              sort: config.esSort
            }
          });
        }
      };
    }
  ]);


  es.service('aggregate', [
    'es', 'state',
    function(es, state) {

      return function(aggs, term) {
        var searchParams = {
          index: state.index(),
          size: 0,
          body: {
            aggs: aggs
          }
        };

        if (!_.isUndefined(term)) {
          searchParams.body.query = {};
          searchParams.body.query.term = term;
        }

        if (state.valid()) {
          return es.search(searchParams);
        }
      };
    }
  ]);


  es.service('index', [
    'es', 'config', 'state',
    function(es, state) {
      return function(body, index, type, id) {
        var doc = {};

        if (!_.isUndefined(id)) {
          doc.id = id;
        }

        doc.index = index;
        doc.body = body;
        doc.type = type;

        return es.index(doc);
      };
    }
  ]);


  es.service('sharedlink', [
    'es', 'config',
    function(es, config) {
      return function(id) {
        return es.search({
          index: config.linkSharingIndex,
          type: config.linkSharingType,
          body: {
            query: {
              match: {
                _id: id
              }
            }
          }
        });
      };
    }
  ]);
}(angular, _));
