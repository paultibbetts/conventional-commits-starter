#!/bin/bash

# copy husky config
cp -u ./dist/.huskyrc $1/.huskyrc && echo 'copied .huskyrc'

# install peer dependencies
if [ -f  "$1/yarn.lock" ]
then
    cd $1 && npx install-peerdeps @ptibbetts/conventional-commits-starter --only-peers --yarn
else
    cd $1 && npx install-peerdeps @ptibbetts/conventional-commits-starter --only-peers
fi

echo 'installed peer dependencies'

# setup conventional commits
if [ -f  "$1/yarn.lock" ]
then
    if cd $1 && commitizen init cz-conventional-changelog --save-dev --save-exact --yarn; then 
        echo 'setup commitizen for yarn'
    else
        echo 'commitizen already setup'
    fi
else
    if cd $1 && commitizen init cz-conventional-changelog --save-dev --save-exact; then
        echo 'setup commitizen'
    else
        echo 'commitizen already setup'
    fi
fi