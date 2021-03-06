module.exports = function(grunt) {
    'use strict';

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-less');

    grunt.initConfig({
        less: {
          dist: {
            files: {
              'assets/css/styles.css': [
                'assets/less/styles.less'
              ]
            },
            options: {
              compress: false,
              sourceMap: true,
              sourceMapFilename: 'assets/css/styles.css.map',



              sourceMapURL: 'styles.css.map'

            }
          }
        },
        watch: {
          configFiles: {
              files: [ 'Gruntfile.js', 'config/*.js' ],
              options: {
                reload: true
              }
            },
            css: {
                files: ['assets/less/**/*.less'],
                tasks: ['less'],
                options: {
                  livereload: true,
                },
            },
            js: {
                files: ['modules/**'],
                options: {
                  livereload: true,
                },
            },
        }
    });

    grunt.registerTask('default', 'watch');
};
