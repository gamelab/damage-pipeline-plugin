module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig( {
		pkg: grunt.file.readJSON( "package.json" ),

		BASE_PATH: "",
		DEVELOPMENT_PATH: "",

		yuidoc: {
			compile: {
				name: "<%= pkg.name %>",
				description: "<%= pkg.description %>",
				version: "<%= pkg.version %>",
				url: "<%= pkg.homepage %>",
				options: {
					extension: ".js",
					paths: "<%= DEVELOPMENT_PATH %>" + "src/",
					outdir: "<%= BASE_PATH %>" + "docs/"
				}
			}
		},

		uglify: {
			build: {
				files: {
					"build/<%= pkg.name %>-<%= pkg.version %>.min.js":
						[ "build/<%= pkg.name %>-<%= pkg.version %>.js" ]
				}
			}
		},

		concat: {
			build: {
				src: "src/**/*.js",
				dest: "build/<%= pkg.name %>-<%= pkg.version %>.js"
			}
		},

		copy: {
			whole: {
				src: [ "examples/**", "docs/**",
					"assets/**", "libs/**", "build/**", "README.md" ],
				dest: "dist/<%= pkg.name %>-<%= pkg.version %>/"
			}
		},

		jshint: {
			src: "src/**",
			options: {
				camelcase: true,
				curly: true,
				eqeqeq: true,
				eqnull: true,
				newcap: true,
				quotmark: "double"
			}
		}

	});

	grunt.loadNpmTasks( "grunt-contrib-uglify" );
	grunt.loadNpmTasks( "grunt-contrib-yuidoc" );
	grunt.loadNpmTasks( "grunt-contrib-concat" );
	grunt.loadNpmTasks( "grunt-contrib-copy" );
	grunt.loadNpmTasks( "grunt-contrib-jshint" );

	grunt.registerTask( "default", [ "jshint", "concat:build",
		"uglify:build" ] );
	grunt.registerTask( "full", [ "jshint", "concat:build",
		"uglify:build", "yuidoc:compile" ] );
};
