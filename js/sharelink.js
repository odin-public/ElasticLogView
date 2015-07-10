(function(angular, _, moment) {
  var sharelink = angular.module('ev.sharelink', ['ev.config']);


  sharelink.controller('ShareLinkController', [
    '$scope', 'state', 'config', 'usSpinnerService', 'index', '$location', '$timeout', '$q',
    function($scope, state, config, usSpinnerService, index, $location, $timeout, $q) {
      var stateId,
          ready = false;

      $scope.enabled = config.linkSharing;
      $scope.spinnerId = 'link-spinner';
      $scope.spinnerActive = false;

      function generateLink(cb) {
        var linkGenerationCallback, p;

        if (!state.valid()) {
          return;
        }

        linkGenerationCallback = $scope.currentOption().cb;

        spinner(true);
        ready = false;

        p = linkGenerationCallback();

        p.then(
          function(res) {
            ready = true;
            stateId = res;
          },
          function(err) {
            console.log(err);
          }
        ).finally(
          function() {
            spinner(false);
          }
        );
      }

      function currentViewLink() {
        var s = state.serialize();

        return index(s, config.linkSharingIndex, config.linkSharingType).then(
          function(res) {
            return res._id;
          }
        );
      }

      function lastNMinutesLink(n) {
        var s = {};

        n = n || 5;

        s.from = moment().subtract(n, 'minutes').toDate();
        s.to = moment().toDate();
        s.baseFilter = state.baseFilter();

        return index(s, config.linkSharingIndex, config.linkSharingType).then(
          function(res) {
            return res._id;
          }
        );
      }

      $scope.radios = [
        {
          caption: "Last 5 minutes",
          id: 'lastn',
          cb: lastNMinutesLink
        },
        {
          caption: "This view",
          id: 'current',
          cb: currentViewLink
        }
      ];

      $scope.currentOption = function() {
        return _
          .chain($scope.radios)
          .where({id: $scope.currentOption.id})
          .first()
          .value();
      };

      $scope.currentOption.id = $scope.radios[0].id;

      $scope.link = function() {
        if (ready) {
          var template = _.template([
            '<%= protocol() %>://<%= host() %>',
            '<% if (port() !== 80) { %>',
            ':<%= port() %>',
            '<% } %>',
            '/#/l/<%= stateId %>'].join(''));

          return template(_.extend({stateId: stateId},
                                   $location));
        }
      };

      $scope.generateLink = generateLink;

      $scope.toggled = function(open) {
        if (!open) {
          return;
        }

        if (!config.linkSharingIndex || !config.linkSharingType) {
          console.err("Attempted to use linkSharing feature with no index or type configured");
          return;
        }

        generateLink($scope.currentOption().cb);
      };

      function spinner(start) {
        if (start) {
          usSpinnerService.spin($scope.spinnerId);
        } else {
          usSpinnerService.stop($scope.spinnerId);
        }

        $scope.spinnerActive = start;
      }
    }
  ]);
}(angular, _, moment));
