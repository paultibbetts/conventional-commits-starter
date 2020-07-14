const fs = require('fs');
const runAll = require('npm-run-all');

fs.exists('.no-postinstall', function(exists) { 
  if (!exists) { 
    runAll('install:*');
  } 
}); 
