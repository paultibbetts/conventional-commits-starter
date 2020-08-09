#!/bin/bash

# copy husky config
cp -u ./dist/.huskyrc $1/.huskyrc && echo 'copied .huskyrc'

cd $1

# install peer dependencies
cmd="npx install-peerdeps @ptibbetts/conventional-commits-starter --only-peers"
if [ -f  "$1/yarn.lock" ]
then
    cmd="$cmd --yarn"
fi
$cmd

# setup conventional commits
cmd="commitizen init cz-conventional-changelog --save-dev --save-exact"
msg="setup commitizen"

if [ -f  "$1/yarn.lock" ]
then
    cmd="$cmd --yarn"
    msg="$msg for yarn"
fi

$cmd >/dev/null 2>&1
echo $msg