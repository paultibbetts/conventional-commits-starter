#!/usr/bin/env node
import chalk from 'chalk';
import jsbeautify from 'js-beautify';
import fs from 'fs';
import https from 'https';
import ora from 'ora';
import { exec } from 'child_process';

const argv = require('yargs')
    .command('$0', `Uses Husky to set up Commitizen to run automatically when you type \`git commit\`.

        - [Commitizen](https://github.com/commitizen/cz-cli)
        - [Husky](https://github.com/typicode/husky)
    `)
    .option('yarn', {
        description: 'Setup for a project that uses Yarn',
        type: 'boolean',
        demand: false,
        default: false,
    })
    .argv;

const HUSKY_CONFIG_FILE_NAME = '.huskyrc.json';
const HUSKY_CONFIG_URL = `https://raw.githubusercontent.com/ptibbetts/conventional-commits-starter/master/${HUSKY_CONFIG_FILE_NAME}`;

const YARN_LOCK_EXISTS = fs.existsSync('yarn.lock');
const YARN = argv.yarn || YARN_LOCK_EXISTS;

const ENCODING = 'utf8';

const syncHuskyConfig = () => {
    const spinner = ora('Syncing husky config').start();
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(HUSKY_CONFIG_FILE_NAME)) {
            spinner.start(`downloading ${HUSKY_CONFIG_FILE_NAME} file...`)
            https.get(HUSKY_CONFIG_URL, function(response) {
                response.pipe(fs.createWriteStream(HUSKY_CONFIG_FILE_NAME));
            });
            spinner.succeed(chalk.green(`${HUSKY_CONFIG_FILE_NAME} file downloaded`))
            resolve();
        } else {
            spinner.warn(chalk.yellow(`${HUSKY_CONFIG_FILE_NAME} file already present`))
            const mergeSpinner = ora('attempting to merge').start();
            mergeHuskyConfigs()
                .then(message => {
                    mergeSpinner.succeed(chalk.green(message));
                    resolve();
                })
                .catch((error) => {
                    mergeSpinner.fail(chalk.red(error))
                    reject(error)
                });
        }
    });
}

const mergeHuskyConfigs = () => {
    const tmpPath = `${HUSKY_CONFIG_FILE_NAME}.tmp`;
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(tmpPath);
        file.on('open', () => {
            https.get(HUSKY_CONFIG_URL, (response) => {
                if (response.statusCode !== 200) {
                    reject('could not download starter config');
                }
                response.on('data', (chunk) => {
                    file.write(chunk);
                }).on('end', () => {
                    file.end();
                    const tmpRaw = fs.readFileSync(tmpPath, ENCODING);
                    const configRaw = fs.readFileSync(HUSKY_CONFIG_FILE_NAME, ENCODING);
                    let tmp, config;
                    try {
                        tmp = JSON.parse(tmpRaw);
                    } catch (error) {
                        reject('There was an error reading the downloaded config file.')
                    }
                    try {
                        config = JSON.parse(configRaw);
                    } catch (error) {
                        reject(`Found an empty ${HUSKY_CONFIG_FILE_NAME} file. If it should be empty then please delete it and run this again.`);
                    }
                    if (JSON.stringify(config) === JSON.stringify(tmp)) {
                        resolve('husky config already setup for Conventional Commits')
                    }
                    fs.writeFileSync(HUSKY_CONFIG_FILE_NAME, jsbeautify((JSON.stringify({
                        ...config,
                        ...tmp
                    }))))
                    fs.unlink(tmpPath, () => {
                        resolve('safely updated existing husky config');
                    });
                }).on('error', (error) => {
                    console.error(chalk.red(error));
                    reject(error);
                })
            })
        });
    })
}

const createConventionalCommitsConfig = () => {
    return new Promise((resolve, reject) => {
        const command = `npx commitizen init cz-conventional-changelog --save-dev --save-exact ${YARN ? '--yarn' : ''}`;
        const spinner = ora('creating Conventional Commit config').start()
        exec(command, (error, {}, stderr) => {
            if (error) {
                spinner.fail(chalk.red('unable to setup Conventional Commits'));
                reject(error);
            }
            if (stderr) {
                if (stderr.includes('A previous adapter is already configured')) {
                    spinner.succeed(chalk.green('Conventional Commit config already setup'))
                    resolve();
                } else {
                    reject(stderr);
                }
            } else {
                spinner.succeed(chalk.green('created Conventional Commit config'))
                resolve();
            }
        });
    });
}

const setupConventionalCommits = () => {
    const command = `npx install-peerdeps @ptibbetts/conventional-commits-starter --only-peers ${YARN ? '--yarn' : ''}`;    
    const spinner = ora('installing peer dependencies...').start()
    return new Promise((resolve, reject) => {
        exec(command, (error) => {
            if (error) {
                reject('Unable to install peer dependencies');
            }

            spinner.succeed(chalk.green('installed peer dependencies'));

            createConventionalCommitsConfig().then(() => {
                resolve()
            }).catch((error) => {
                reject(error);
            });
        });
    });
}

console.log(chalk.white(`\nSetting up Conventional Commits${YARN ? ' for a Yarn project' : ''}...\n`));

syncHuskyConfig()
    .then(() => {
        return setupConventionalCommits();
    })
    .then(() => {
        console.log();
        console.log(chalk.green('You\'re ready to use Conventional Commits!'));
        console.log(chalk.green('Get started by running ') + chalk.bold('git commit'));
    })
    .catch((error) => {
        console.log();
        console.log(chalk.red(error));
        console.error(chalk.red('Please let me know about it at https://github.com/ptibbetts/conventional-commits-starter/issues/new/'))
    });