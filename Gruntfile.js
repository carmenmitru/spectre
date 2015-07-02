module.exports = function (grunt) {
    // load all grunt tasks
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            lib: {
                options: {
                    // node environment
                    node: true,
                    // browser environment
                    browser: false,
                    // allow dangling underscores in var names
                    nomen: true,
		    esnext: true
                },
                files: {
                    src: [
                        'lib/*.js',
                    ]
                }
            },
            test: {
                options: {
                    // node environment
                    node: true,
                    // browser environment
                    browser: false,
                    // allow dangling underscores in var names
                    nomen: true,
                    // allow expressions
                    expr: true,
                    esnext: true
                },
                files: {
                    src: [
                        'test/*.js',
                    ]
                }
            }
        },
        mochacli: {
            options: {
                ui: 'bdd',
                reporter: 'spec',
                timeout: '15000'
            },

            all: {
                src: ['test/**/*_spec.js']
            }
        }
    });

    grunt.registerTask('test', ['jshint', 'mochacli:all']);
};
