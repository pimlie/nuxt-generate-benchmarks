#!/usr/bin/env node
/**
 * Nuxt Generate benchmark v1.0
 * by pimlie
 *
 * Create a ramdisk before running, this should fully rule out that i/o
 * is still a factor in one of the results (but a ssd/nvme disk should be 
 * fine as well):
 * $ sudo mount -t tmpfs -o size=32m tmpfs ./ramdisk/
 *
 * Usage:
 *
 * Build (no benchmarks):
 * $ ./benchmark.js -b
 *
 * Benchmark:
 * $ ./benchmark.js > results.json
 *
 * When all benchmarks are done they are written as json string to stdout,
 * progress messages are written to stderr
 */
const assert = require('assert')
const fs = require('fs')
const { resolve } = require('path')
const { promisify } = require('util')
const { Nuxt, Builder, Generator } = require('../..')

const readDir = promisify(fs.readdir)

const options = {
  rootDir: resolve('./fixture'),
  dev: false,
  build: {
    quiet: true
  },
  modulesDir: [
    resolve('.', 'node_modules')
  ],
  generate: {
    subFolder: false,
    dir: resolve('.', 'ramdisk', 'dist'),
    concurrency: 500,
    interval: 0,
    concurrenceMethod: ''
  }
}

let distDirs = {
  users: resolve(options.generate.dir, 'users'),
  workload: resolve(options.generate.dir, 'workload')
}

const routesCount = 1000
const routes = {
  default: ','.repeat(routesCount - 1).split(',').map((v, idx) => {
    return { route: '/users/' + idx, payload: null }
  }),
  workload: (workloads) => {
    return ','.repeat(routesCount - 1).split(',').map((v, idx) => {
      return { route: '/workload/' + idx, payload: { id: idx, workloads } }
    })
  }
}

const benchmarks = []
const concurrencies = [1, 2, 3, 4, 5, 7, 10, 15, 20, 25, 30, 40, 50, 100, 200, 300, 400, 500, 750, 1000]
const intervals = [0] //[5] //, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const concurrenceMethods = ['current', 'ifInterval', 'throttle', 'wait', 'race', 'waitthrottled']

concurrencies.forEach((concurrency) => {
  // api interval benchmarks (interval=5)
  /*intervals.forEach((interval) => {
    concurrenceMethods.forEach((concurrenceMethod) => {
      benchmarks.push({
        name: concurrenceMethod,
        routes: (() => {
          return ','.repeat(routesCount - 1).split(',').map((v, idx) => {
            const workloads = [{ block: (idx % 10) ? 0 : 25, wait: (idx % 10) ? 5 : 0 }]
            return { route: '/workload/' + idx, payload: { id: idx, workloads } }
          })
        })(),
        distDir: distDirs.workload,
        options: {
          concurrenceMethod,
          concurrency,
          interval
        }
      })
    })
  })/**/

  
  // concurrency method benchmarks (interval=0)
  intervals.forEach((interval) => {
    concurrenceMethods.forEach((concurrenceMethod) => {
      benchmarks.push({
        name: concurrenceMethod,
        routes: (() => {
          return ','.repeat(routesCount - 1).split(',').map((v, idx) => {
            const workloads = [{ block: 1 }, { wait: (idx % 10) ? 0 : 50 }]
            return { route: '/workload/' + idx, payload: { id: idx, workloads } }
          })
        })(),
        distDir: distDirs.workload,
        options: {
          concurrenceMethod,
          concurrency,
          interval
        }
      })
    })
  })
  
  /* / concurrency vs interval benchmarks
  intervals.forEach((interval) => {
    benchmarks.push({
      name: 'no workload, no payload',
      routes: routes.default,
      distDir: distDirs.users,
      options: {
        concurrency,
        interval
      }
    })
  })

  intervals.forEach((interval) => {
    benchmarks.push({
      name: 'no workload, only payload',
      routes: routes.workload(false),
      distDir: distDirs.workload,
      options: {
        concurrency,
        interval
      }
    })
  })

  intervals.forEach((interval) => {
    benchmarks.push({
      name: 'workload waiting=10',
      routes: routes.workload([{ wait: 10 }]),
      distDir: distDirs.workload,
      options: {
        concurrency,
        interval
      }
    })
  })

  /*intervals.forEach((interval) => {
    benchmarks.push({
      name: 'workload blocking=10',
      routes: routes.workload([{ block: 10 }]),
      distDir: distDirs.workload,
      options: {
        concurrency,
        interval
      }
    })
  })

  intervals.forEach((interval) => {
    benchmarks.push({
      name: 'workload waiting=5 blocking=5)',
      routes: routes.workload([{ wait: 5, block: 5 }]),
      distDir: distDirs.workload,
      options: {
        concurrency,
        interval
      }
    })
  })

  intervals.forEach((interval) => {
    benchmarks.push({
      name: 'workload(2,2,2,2,2)',
      routes: routes.workload([{ wait: 2, block: 2 },{ wait: 2, block: 2 },{ wait: 2 }]),
      distDir: distDirs.workload,
      options: {
        concurrency,
        interval
      }
    })
  })/**/
})

const nuxt = new Nuxt(options)
const builder = new Builder(nuxt)
const generator = new Generator(nuxt, builder)

let startTime
let apiIntervals = []

/*nuxt.hook('generate:page', ({ route }) => {
  apiIntervals.push((new Date()).getTime())
})/**/

async function runBenchmark({ routes, distDir }) {
  await generator.initiate({ build: false, init: true })
  /*
  startTime = (new Date()).getTime()
  const interval = nuxt.options.generate.interval
  apiIntervals = []
  /**/
  const routesCopy = routes.slice()
  const s = process.hrtime()
  const errors = await generator.generateRoutes(routesCopy)
  const t = process.hrtime(s)

  assert.strictEqual(errors.length, 0)
  const files = await readDir(distDir)
  assert.strictEqual(files.length, routesCount)
/*
  const minTime = Math.min.apply(undefined, apiIntervals)
  apiIntervals = apiIntervals.map(v => +(v - minTime))

  const counts = []
  for (let i = 0; i <= Math.max.apply(undefined, apiIntervals) + interval; i += interval) {
    const count = apiIntervals.filter(v => v >= i && v < (i + interval))
    counts.push(count.length)
  }/**/

  return { time: (t[0] * 1e9 + t[1]) / 1e6, value: 1/*counts.filter(v => v > 2).length*/ }
}

const results = []
function run() {
  if (process.argv.includes('-b')) {
    return generator.initiate({ build: true, init: true })
  } else {
    let p = Promise.resolve()
    benchmarks.forEach((benchmark) => {
      p = p.then(() => {
        return new Promise(async (resolve) => {
          generator.options.generate = Object.assign(options.generate, benchmark.options || {})

          process.stderr.write(`${benchmark.name} (${generator.options.generate.concurrency}/${generator.options.generate.interval}):`)
          const { time, value } = await runBenchmark(benchmark)
          
          results.push({
            name: benchmark.name,
            time,
            // value,
            routes: benchmark.routes.length,
            concurrency: generator.options.generate.concurrency,
            interval: generator.options.generate.interval
          })
          
          const timePerRoute = time / benchmark.routes.length
          const routesPerSec = timePerRoute ? Math.round(10000 / timePerRoute) / 10 : 0
          process.stderr.write(` ${routesPerSec} (${Math.round(100 * timePerRoute) / 100}ms / ${Math.round(10 * time / 1000) / 10}s)\n`)

          resolve()
        })
      })
    })

    return p
  }
}

run().then(() => {
  console.error('All benchmarks finished')

  if (results.length) {
    let name = ''
    if (process.argv.includes('-n')) {
      name = process.argv[process.argv.indexOf('-n') + 1] || ''
    }
    
    const json = {
      name,
      versions: {
        node: process.version,
        nuxt: require('./node_modules/nuxt/package.json').version
      },
      results
    }
    console.log(JSON.stringify(json))
  }
})
