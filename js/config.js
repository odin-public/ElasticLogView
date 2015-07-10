(function(angular, _) {
  var cnf = angular.module('ev.config', ['angular-loading-bar']);

  // Validate incoming base filter value and transform it, if needed
  function baseFilterValidator(value) {
    var uuidRegexp = /^(stack-)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
        match = uuidRegexp.exec(value);

    if (match !== null) {
      return match[0];
    }

    return null;
  }


  cnf.config(['cfpLoadingBarProvider', function(cfpLoadingBarProvider) {
    cfpLoadingBarProvider.includeSpinner = false;
    cfpLoadingBarProvider.latencyThreshold = 500;
  }]);


  cnf.provider('config', [
    function() {
      function logLevelToBootstrapColor(level) {
        if (/(DEBUG|DBG)/i.test(level)) return 'success';
        if (/(INFO?)/i.test(level)) return 'info';
        if (/(WARN)/i.test(level)) return 'warning';
        if (/(ERR(OR)?)/i.test(level)) return 'danger';

        return 'danger';
      }

      function logLevelCssClass(level) {
        return 'text-' + logLevelToBootstrapColor(level);
      }

      return {
        $get: function() {
          return {
            // ElasticSearch host to connect to
            esHost: 'localhost:9200',

            // Maximum days to look back for indices
            indexDaysBack: 14,

            // Index pattern, interpeted in same way as kibana3 does
            indexPattern: 'logstash-[YYYY.MM.DD]',

            // Base filter field, the value for this filter comes from URL
            baseFilterField: 'some_id.raw',

            // Validator function
            baseFilterValidator: baseFilterValidator,

            // Default response size
            esSize: 200,

            // Choices for user to select response size from
            allowedSizes: [100, 200, 500, 1000],

            // How often to refresh the page, in milliseconds
            refreshInterval: 1000,

            // ElasticSearch API version
            apiVersion: '1.3',

            // Version of the introduction doc, change this any time you change the intro,
            // so that it gets shown for users
            introVersion: '1',

            // Enable or disable link sharing
            linkSharing: true,

            // ES index and doc type for share link information
            linkSharingIndex: 'elv-links',
            linkSharingType: 'link',

            // ElasticSearch 'sort' field in request
            esSort: [
              {
                '@timestamp': {
                  order: 'desc',
                  unmapped_type: 'date'
                }
              },
              {
                'seqnum': {
                  order: 'desc',
                  unmapped_type: 'long'
                }
              }
            ],
            // Which log fields to show on log view
            logFields: [
              {
                name: '@timestamp',
                map: function(date) {
                  return date.replace('Z', '');
                }
              },
              {
                name: 'file',
                cssClass: function() { return 'text-primary'; },
                padding: 8,
                map: function(file) {
                  var path = file.split(/[\\\/]/);

                  return path[path.length - 1];
                }
              },
              {
                name: 'loglevel',
                cssClass: logLevelCssClass,
                padding: 6
              },
              {
                name: 'log_message'
              }
            ],

            // Filters that will be available to user. They may not be
            // listed in logFields setting
            filters: [
              {
                caption: 'Log level',
                field: 'loglevel',
                cssClass: logLevelCssClass
              },
              {
                caption: 'Log file',
                field: 'file'
              }
            ],

            // Show this introduction to first-time user, or to the user,
            // whose localstorage does not have specified introVersion value
            intro: [
              {
                intro: "Welcome to ElasticView! This guide will follow you through the basics of using this interface."
              },
              {
                element: '#logView',
                position: 'left',
                intro: 'This is main view, your filtered logs will appear here.'
              },
              {
                element: '#termFilters',
                position: 'right',
                intro: 'These are "term" filters - they are unique values of some fields from log events. Toggle the checkboxes to show/hide certain events with these fields.'
              },
              {
                element: '#dateFilters',
                position: 'right',
                intro: 'This is time interval filter, you can specify time range for events to show.'
              },
              {
                element: '#viewSettings',
                position: 'right',
                intro: 'Here you can specify how many log events to fetch per refresh.'
              },
              {
                element: '#autorefreshToggle',
                position: 'left',
                intro: 'Set this switch to "Off" to disable log auto-fetching.'
              },
              {
                element: '#filterHamburger',
                position: 'right',
                intro: 'Use this button to show/hide filters panel.'
              }
            ]
          };
        }
      };
    }]);
}(angular, _));
