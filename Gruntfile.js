module.exports = function (grunt) {
    require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        exec: {
            prepare: {
                command: "phonegap prepare",
                stdout: true,
                stderr: true
            }
        },
        watch: {
            html: {
                files: ["www/**/*.*"],
                tasks: ["exec:prepare"]
            }
        }
    });
    
    grunt.registerTask("default", []);
};

