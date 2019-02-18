module.exports = {
    /**
     * Processes all activities that can be run by the program, and schedules programs with timing triggers
     * @param {Object[]} activities the activities object array from the main script, hold all loaded activities
     * @param {Object[]} scheduledFunctions an array holding the functions that are scheduled to run
     * @param {Object} schedule an imported library that can schedule functions to run for use with a cron string
     */
    processActivities: function(activities, scheduledFunctions, schedule) {
        //this schedules activities that happen at a particular time
        var activitiesToSchedule = activities.filter((eachActivity) => {
            return (eachActivity.triggers.timeofday !== undefined && eachActivity.on);
        });
        if (activitiesToSchedule.length > 0) {
            activitiesToSchedule.map((scheduledActivity) => {
                var cronStr = scheduledActivity.triggers.timeofday;
                var j = schedule.scheduleJob(cronStr, function(fireTime) {
                    device_tools.runActivity(modules, activities, devices, scheduledActivity.name);
                    console.log(scheduledActivity.name + ' ran at ' + fireTime);
                });
                j.jobname = scheduledActivity.name;
                scheduledFunctions.push(j);
            });
        }
        console.log('Scheduled ' + scheduledFunctions.length + ' activities, loaded a total of ' + activities.length + ' activities');
    }
}