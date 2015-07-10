module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      vendor: {
        src: [
          'bower_components/intro.js/minified/intro.min.js',
          'bower_components/underscore/underscore-min.js',
          'bower_components/moment/min/moment.min.js',
          'bower_components/spin.js/spin.js',
          'bower_components/angular/angular.min.js',
          'bower_components/angular-route/angular-route.min.js',
          'bower_components/elasticsearch/elasticsearch.angular.min.js',
          'bower_components/angular-bootstrap/ui-bootstrap.min.js',
          'bower_components/angular-scroll-glue/src/scrollglue.js',
          'bower_components/angular-loading-bar/build/loading-bar.min.js',
          'bower_components/angular-spinner/angular-spinner.min.js'
        ],
        dest: 'build/vendor.min.js'
      },
      elv: {
        src: [
          'js/*.js'
        ],
        dest: 'build/<%= pkg.name %>.js'
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        files: {
          'build/<%= pkg.name %>.js': ['js/*.js']
        }
      }
    },
    watch: {
      scripts: {
        files: ['**/*.js', '!build/*.js',
                '!bower_components/**/*.js',
                '!node_modules/**/*.js'],
        tasks: ['concat']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['concat', 'uglify']);
};
