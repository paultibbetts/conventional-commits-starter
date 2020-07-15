#!/bin/bash

# install peer dependencies
if [[ -f  "$INIT_CWD/yarn.lock" ]]
then
    cd $INIT_CWD && npx install-peerdeps @ptibbetts/conventional-commits-starter --only-peers --yarn
else
    cd $INIT_CWD && npx install-peerdeps @ptibbetts/conventional-commits-starter --only-peers
fi

# setup conventional commits
commitizen init cz-conventional-changelog --save-dev --save-exact

# copy husky config
cp -u ./dist/.huskyrc $INIT_CWD/.huskyrc