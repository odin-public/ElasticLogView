module.exports = function(grunt) {
grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
        vendor_css: {
            src: [
                'bower_components/bootstrap/dist/css/bootstrap.min.css',
                'bower_components/intro.js/minified/introjs.min.css',
                'bower_components/angular-loading-bar/build/loading-bar.min.css',
            ],
            dest: 'build/css/vendor.min.css'
        },
        app_css: {
            src: [
                'css/*.css'
            ],
            dest: 'build/css/doc.css'
        },
        vendor: {
            src: [
                'bower_components/intro.js/minified/intro.min.js',
                'bower_components/underscore/underscore-min.js',
                'bower_components/moment/min/moment.min.js',
                'bower_components/spin.js/spin.js',
                'bower_components/angular/angular.min.js',
                'bower_components/angular-route/angular-route.min.js',
                'bower_components/angular-animate/angular-animate.min.js',
                'bower_components/elasticsearch/elasticsearch.angular.min.js',
                'bower_components/angular-bootstrap/ui-bootstrap.min.js',
                'bower_components/angular-scroll-glue/src/scrollglue.js',
                'bower_components/angular-loading-bar/build/loading-bar.min.js',
                'bower_components/angular-spinner/angular-spinner.min.js',
            ],
            dest: 'build/js/vendor.min.js'
        },
        elv: {
            options : {
                sourceMap :true,
                separator: ';',
            },
            src: [
                'js/*.js'
            ],
            dest: '.tmp/<%= pkg.name %>.js'
        }
    },
    copy: {
        tmp_script: {
            expand: true,
            dot: true,
            cwd: '.tmp/',
            src: '*',
            dest: 'build/js/',
        },
        fonts: {
            expand: true,
            cwd: 'bower_components/bootstrap/fonts/',
            src: '*',
            dest: 'build/fonts/',
        },  
    },
    uglify: {
        options: {
            banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        },
        build: {
            files: {
                'build/js/<%= pkg.name %>.js': ['js/*.js']
            }
        }
    },
    watch: {
        style: {
            files: [
                'css/**/*.css',
            ],
            tasks: ['concat:app_css']
        },
        scripts: {
            files: [
                'js/**/*.js',
            ],
            tasks: ['concat:elv', 'copy:tmp_script']
        }
    }
});


    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask('default', ['concat', 'copy:fonts', 'uglify']);
};
