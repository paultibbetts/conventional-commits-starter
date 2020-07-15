#!/bin/bash

# install peer dependencies
cd $INIT_CWD && npx install-peerdeps @ptibbetts/conventional-commits-starter --only-peers

# setup conventional commits
commitizen init cz-conventional-changelog --save-dev --save-exact

# copy husky config
cp -u ./dist/.huskyrc $INIT_CWD/.huskyrc