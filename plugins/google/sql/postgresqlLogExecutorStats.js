var async = require('async');
var helpers = require('../../../helpers/google');

module.exports = {
    title: 'PostgreSQL Log Executor Stats Disabled',
    category: 'SQL',
    domain: 'Databases',
    description: 'Ensures SQL instances for PostgreSQL type have log_executor_stats flag set to "off".',
    more_info: 'To avoid any performance issues caused by an increased volume of logs, it is recommended that the "log_executor_stats" flag is set to off.',
    link: 'https://cloud.google.com/sql/docs/postgres/flags',
    recommended_action: 'Ensure that log_executor_stats flag is disabled for all PostgreSQL instances.',
    apis: ['sql:list'],

    run: function(cache, settings, callback) {
        var results = [];
        var source = {};
        var regions = helpers.regions();

        let projects = helpers.addSource(cache, source,
            ['projects','get', 'global']);

        if (!projects || projects.err || !projects.data) {
            helpers.addResult(results, 3,
                'Unable to query for projects: ' + helpers.addError(projects), 'global', null, null, projects.err);
            return callback(null, results, source);
        }

        let project = projects.data[0].name;

        async.each(regions.sql, function(region, rcb) {
            let sqlInstances = helpers.addSource(
                cache, source, ['sql', 'list', region]);

            if (!sqlInstances) return rcb();

            if (sqlInstances.err || !sqlInstances.data) {
                helpers.addResult(results, 3, 'Unable to query SQL instances: ' + helpers.addError(sqlInstances), region);
                return rcb();
            }

            if (!sqlInstances.data.length) {
                helpers.addResult(results, 0, 'No SQL instances found', region);
                return rcb();
            }

            sqlInstances.data.forEach(sqlInstance => {
                if (sqlInstance.instanceType && sqlInstance.instanceType.toUpperCase() === 'READ_REPLICA_INSTANCE') return;

                let resource = helpers.createResourceName('instances', sqlInstance.name, project);
                
                if (sqlInstance.databaseVersion && !sqlInstance.databaseVersion.toLowerCase().includes('postgres')) {
                    helpers.addResult(results, 0, 
                        'SQL instance database type is not of PostgreSQL type', region, resource);
                    return;
                }

                let found;

                if (sqlInstance.settings &&
                    sqlInstance.settings.databaseFlags &&
                    sqlInstance.settings.databaseFlags.length) {
                    found = sqlInstance.settings.databaseFlags.find(flag => flag.name && flag.name == 'log_executor_stats' &&
                        flag.value && flag.value == 'on');
                } 

                if (found) {
                    helpers.addResult(results, 2,
                        'SQL instance has log_executor_stats flag enabled', region, resource);
                } else {
                    helpers.addResult(results, 0, 
                        'SQL instance does not have log_executor_stats flag enabled', region, resource);
                }
            });

            rcb();
        }, function() {
            // Global checking goes here
            callback(null, results, source);
        });
    }
};

