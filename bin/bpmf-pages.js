#!/usr/bin/env node

// 指定 gulpfile  cwd
process.argv.push('--cwd')
process.argv.push(process.cwd())

process.argv.push('--gulpfile')
process.argv.push(require.resolve('..'))

require('gulp/bin/gulp')

