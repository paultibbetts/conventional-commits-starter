#!/usr/bin/env node
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var chalk_1 = __importDefault(require("chalk"));
var js_beautify_1 = __importDefault(require("js-beautify"));
var fs_1 = __importDefault(require("fs"));
var https_1 = __importDefault(require("https"));
var ora_1 = __importDefault(require("ora"));
var child_process_1 = require("child_process");
var argv = require('yargs')
    .command('$0', "Uses Husky to set up Commitizen to run automatically when you type `git commit`.\n\n        - [Commitizen](https://github.com/commitizen/cz-cli)\n        - [Husky](https://github.com/typicode/husky)\n    ")
    .option('yarn', {
    description: 'Setup for a project that uses Yarn',
    type: 'boolean',
    demand: false,
    default: false,
})
    .argv;
var HUSKY_CONFIG_FILE_NAME = '.huskyrc.json';
var HUSKY_CONFIG_URL = "https://raw.githubusercontent.com/ptibbetts/conventional-commits-starter/master/" + HUSKY_CONFIG_FILE_NAME;
var YARN_LOCK_EXISTS = fs_1.default.existsSync('yarn.lock');
var YARN = argv.yarn || YARN_LOCK_EXISTS;
var ENCODING = 'utf8';
var syncHuskyConfig = function () {
    var spinner = ora_1.default('Syncing husky config').start();
    return new Promise(function (resolve, reject) {
        if (!fs_1.default.existsSync(HUSKY_CONFIG_FILE_NAME)) {
            spinner.start("downloading " + HUSKY_CONFIG_FILE_NAME + " file...");
            https_1.default.get(HUSKY_CONFIG_URL, function (response) {
                response.pipe(fs_1.default.createWriteStream(HUSKY_CONFIG_FILE_NAME));
            });
            spinner.succeed(chalk_1.default.green(HUSKY_CONFIG_FILE_NAME + " file downloaded"));
            resolve();
        }
        else {
            spinner.warn(chalk_1.default.yellow(HUSKY_CONFIG_FILE_NAME + " file already present"));
            var mergeSpinner_1 = ora_1.default('attempting to merge').start();
            mergeHuskyConfigs()
                .then(function (message) {
                mergeSpinner_1.succeed(chalk_1.default.green(message));
                resolve();
            })
                .catch(function (error) {
                mergeSpinner_1.fail(chalk_1.default.red(error));
                reject(error);
            });
        }
    });
};
var mergeHuskyConfigs = function () {
    var tmpPath = HUSKY_CONFIG_FILE_NAME + ".tmp";
    return new Promise(function (resolve, reject) {
        var file = fs_1.default.createWriteStream(tmpPath);
        file.on('open', function () {
            https_1.default.get(HUSKY_CONFIG_URL, function (response) {
                if (response.statusCode !== 200) {
                    reject('could not download starter config');
                }
                response.on('data', function (chunk) {
                    file.write(chunk);
                }).on('end', function () {
                    file.end();
                    var tmpRaw = fs_1.default.readFileSync(tmpPath, ENCODING);
                    var configRaw = fs_1.default.readFileSync(HUSKY_CONFIG_FILE_NAME, ENCODING);
                    var tmp, config;
                    try {
                        tmp = JSON.parse(tmpRaw);
                    }
                    catch (error) {
                        reject('There was an error reading the downloaded config file.');
                    }
                    try {
                        config = JSON.parse(configRaw);
                    }
                    catch (error) {
                        reject("Found an empty " + HUSKY_CONFIG_FILE_NAME + " file. If it should be empty then please delete it and run this again.");
                    }
                    if (JSON.stringify(config) === JSON.stringify(tmp)) {
                        resolve('husky config already setup for Conventional Commits');
                    }
                    fs_1.default.writeFileSync(HUSKY_CONFIG_FILE_NAME, js_beautify_1.default((JSON.stringify(__assign(__assign({}, config), tmp)))));
                    fs_1.default.unlink(tmpPath, function () {
                        resolve('safely updated existing husky config');
                    });
                }).on('error', function (error) {
                    console.error(chalk_1.default.red(error));
                    reject(error);
                });
            });
        });
    });
};
var createConventionalCommitsConfig = function () {
    return new Promise(function (resolve, reject) {
        var command = "npx commitizen init cz-conventional-changelog --save-dev --save-exact " + (YARN ? '--yarn' : '');
        var spinner = ora_1.default('creating Conventional Commit config').start();
        child_process_1.exec(command, function (error, _a, stderr) {
            if (error) {
                spinner.fail(chalk_1.default.red('unable to setup Conventional Commits'));
                reject(error);
            }
            if (stderr) {
                if (stderr.includes('A previous adapter is already configured')) {
                    spinner.succeed(chalk_1.default.green('Conventional Commit config already setup'));
                    resolve();
                }
                else {
                    reject(stderr);
                }
            }
            else {
                spinner.succeed(chalk_1.default.green('created Conventional Commit config'));
                resolve();
            }
        });
    });
};
var setupConventionalCommits = function () {
    var command = "npx install-peerdeps @ptibbetts/conventional-commits-starter --only-peers " + (YARN ? '--yarn' : '');
    var spinner = ora_1.default('installing peer dependencies...').start();
    return new Promise(function (resolve, reject) {
        child_process_1.exec(command, function (error) {
            if (error) {
                reject('Unable to install peer dependencies');
            }
            spinner.succeed(chalk_1.default.green('installed peer dependencies'));
            createConventionalCommitsConfig().then(function () {
                resolve();
            }).catch(function (error) {
                reject(error);
            });
        });
    });
};
console.log(chalk_1.default.white("\nSetting up Conventional Commits" + (YARN ? ' for a Yarn project' : '') + "...\n"));
syncHuskyConfig()
    .then(function () {
    return setupConventionalCommits();
})
    .then(function () {
    console.log();
    console.log(chalk_1.default.green('You\'re ready to use Conventional Commits!'));
    console.log(chalk_1.default.green('Get started by running ') + chalk_1.default.bold('git commit'));
})
    .catch(function (error) {
    console.log();
    console.log(chalk_1.default.red(error));
    console.error(chalk_1.default.red('Please let me know about it at https://github.com/ptibbetts/conventional-commits-starter/issues/new/'));
});
