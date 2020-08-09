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
commitizen init cz-conventional-changelog --save-dev --save-exact --force

echo 'setup commitizen'