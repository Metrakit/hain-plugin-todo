'use strict';

const _        = require('lodash');
const jsonfile = require('jsonfile');
const crypto   = require('crypto');
const options  = require('./package.json').hain;

module.exports = (pluginContext) => {

    const logger = pluginContext.logger;
    const app = pluginContext.app;
    const toast = pluginContext.toast;

    var tasks = [];
    var repo = "";
    var todofile = "";

    var global_res;

    function startup() {
        repo = pluginContext.MAIN_PLUGIN_REPO;
        todofile = `${repo}/hain-plugin-todo/todolist.json`;
        jsonfile.readFile(todofile, function(err, obj) {
            if (obj.length > 0) {
                tasks = _.sortBy(obj, function(o) { return o.title; });;
                logger.log(tasks);
            }
        });
    }

    function search(query, res) {
        if (query.length > 0 && query != '' &&  query != ' ') {
            var id = crypto.randomBytes(20).toString('hex');
            var currentDate = new Date();
            var day = currentDate.getDate();
            var month = currentDate.getMonth() + 1;
            var year = currentDate.getFullYear();
            var full_date = day + "/" + month + "/" + year;
            var new_task = {
                id: id,
                title: query,
                date: full_date
            };
            res.add({
                id: new_task,
                payload: 'add',
                title: 'Add a task',
                desc: `Task: ${query}`,
                icon: '#fa fa-plus-circle'
            });
        } else {
            var message = 'Help';
            var desc = 'Write /todo something and press enter for add a card.';
            if (tasks.length === 0) {
                message = 'You have no tasks !';
            }
            res.add({
                id: 'help',
                payload: 'help',
                title: message,
                desc: desc,
                icon: '#fa fa-question-circle'
            });
            if (tasks.length === 0) {
                return;
            }
        }

        _.forEach(tasks, (task) => {
            res.add({
                id: task.id,
                payload: 'done',
                title: task.title,
                desc: 'Created at <b>' + task.date + '</b>. Click for done.',
                icon: '#fa fa-circle-o'
            });
        });
    }

    function execute(obj, payload) {
        if (payload !== 'add' && payload !== 'done') {
            return;
        }
        if (payload === 'add') {
            tasks.push(obj);
            jsonfile.writeFile(todofile, tasks);
            toast.enqueue('Task added !');//todo
        } else if (payload === 'done' && obj) {
            tasks = _.filter(tasks, function(task) { return task.id !== obj; });
            toast.enqueue('Task done !');
        }

        if (tasks === undefined) {
            tasks = [];
        }

        jsonfile.writeFile(todofile, tasks);
        app.setInput(options.prefix);
    }

    return { startup, search, execute };
};
