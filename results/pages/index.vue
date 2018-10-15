<template>
<b-container fluid>
  <b-row>
    <b-col>
      <svg id="benchmark" width="1280" height="700"></svg>
    </b-col>

    <b-col cols="3">
      <b-card class="mt-3">
        <h5>Nuxt Generate Benchmarks</h5>
        <p><a href="https://github.com/pimlie/nuxt-generate-benchmarks">More information on GitHub</a></p>

        <b-form-group label="Select benchmark">
          <b-form-radio-group id="benchmark" stacked v-model="selectedBenchmark" :options="benchmarkOptions"></b-form-radio-group>
        </b-form-group>

        <b-form-group v-if="!groupedResultSets" label="Select result set">
          <b-form-radio-group id="resultset" stacked v-model="selectedResultSet" :options="resultSets"></b-form-radio-group>
        </b-form-group>
        <p v-else>
          ResultSet legenda:
          <b-form-checkbox-group v-model="selectedResultSets" stacked>
            <b-form-checkbox v-for="(resultSet, index) in resultSets" :key="index" :id="'set' + index" :value="resultSet.text"><span style="display: inline-block; width: 1.1em">
              {{ String.fromCharCode(97 + index) }}.</span> {{ resultSet.text }}
            </b-form-checkbox>
          </b-form-checkbox-group>
        </p>
        
        <b-form-group label="View options">
          <b-form-checkbox-group v-model="viewOptions" stacked>
            <b-form-checkbox id="hide-values" value="hideValues">Hide value labels</b-form-checkbox>
            <b-form-checkbox id="min-offset" value="minOffset" :disabled="valueKey === 'pages'">Set minimum value as offset</b-form-checkbox>
          </b-form-checkbox-group>
          <template v-if="minOffset">
            Actual values are +{{ minimumValue }}
          </template>
        </b-form-group>  

        <b-form-group label="Show value">
          <b-form-radio-group id="valueKey" v-model="valueKey" :options="valueKeys" stacked></b-form-radio-group>
        </b-form-group>  
      </b-card>

      <b-card v-if="benchmark" class="mt-3">
        Versions:
        <p v-for="(resultSet, index) in benchmark.resultSets" v-if="resultSet.versions" :key="index">
          Result Set <i>{{ resultSet.name }}</i>:<br/>
          Node {{ resultSet.versions.node }}<br/>
          Nuxt v{{ resultSet.versions.nuxt }}<br/>
        </p>

        <small>
          <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">
            <img alt="Creative Commons Licence" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/80x15.png" />
          </a><br />
          This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.
          </small>
      </b-card>
    </b-col>
  </b-row>
</b-container>
</template>

<script>
import _ from 'lodash'
import Barchart3D from '~/assets/3d-barchart'
import results1 from '~/assets/results/concurrency_interval.json'
import results2 from '~/assets/results/method1.json'
import results3 from '~/assets/results/method2.json'
import results4 from '~/assets/results/interval-throttling.json'

export default {
  data() {
    return {
      barchartOptions: {
        origin: [550, 370],
        scale: 13
      },
      valueKey: 'avgTime',
      valueKeys: [
        { value: 'totalTime', text: 'Total Time (s)' },
        { value: 'avgTime', text: 'Average Time (ms)' },
        { value: 'pages', text: 'Pages per second' }
      ],
      benchmarks: [{
        name: 'concurrency vs interval',
        resultSets: [
          results1
        ]
      }, {
        name: 'concurrency method',
        resultSets: [
          results2,
          results3
        ]
      }, {
        name: 'interval throttling',
        resultSets: [
          results4
        ]
      }],
      /* internal props: */
      barchart: null,
      selectedBenchmark: null,
      benchmarkChanged: false,
      firstDraw: false,
      selectedResultSet: null,
      selectedResultSets: [],
      viewOptions: [],
      groupedResultSets: false,
      minimumValue: null
    }
  },

  computed: {
    benchmark() {
      return this.benchmarks[this.selectedBenchmark]
    },
    benchmarkOptions() {
      return this.benchmarks.map((benchmark, index) => {
        return {
          value: index,
          text: benchmark.name
        }
      })
    },
    resultSets() {
      if (!this.benchmark) {
        return []
      }

      return _.sortBy(_.uniqWith(
        _.flatten(this.benchmark.resultSets.map((resultSet, setIndex) => {
          return resultSet.results.map((result, resIndex) => {
            const text = result.name + (resultSet.name ? ` (${resultSet.name})` : '')

            this.benchmark.resultSets[setIndex].results[resIndex].text = text
            return {
              value: text,
              text
            }
          })
        })), (left, right) => {
          return left.text === right.text
        }
      ), ['text'])
    },
    resultSetsData() {
      if (!this.benchmark || !this.selectedResultSets.length) {
        return []
      }

      return _.flatten(this.benchmark.resultSets.map((resultSet) => {
          return resultSet.results.filter(result => this.selectedResultSets.includes(result.text))
      }))
    },
    hideValues() {
      return this.viewOptions.includes('hideValues')
    },
    minOffset() {
      return this.viewOptions.includes('minOffset')
    }
  },
  
  watch: {
    selectedBenchmark(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.benchmarkChanged = true
        this.drawBenchmarkResult()
      }
    },
    selectedResultSet(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.$set(this, 'selectedResultSets', [ newVal ])
      }
    },
    selectedResultSets(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.drawBenchmarkResult()
      }
    },
    hideValues(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.drawBenchmarkResult()
      }
    },
    minOffset(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.drawBenchmarkResult()
      }
    },
    valueKey(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.drawBenchmarkResult()
      }
    },
  },

  mounted() {
    if (process.client) {
      this.barchart = new Barchart3D('#benchmark', this.barchartOptions)
      this.barchart.initiate()
    }

    this.selectedBenchmark = 0
  },

  methods: {
    drawBenchmarkResult() {
      if (this.benchmarkChanged) {
        this.selectedResultSet = this.resultSets[0].value
        this.firstDraw = true
        this.benchmarkChanged = false
        return
      }
      
      let data = _.sortBy(this.resultSetsData, ['interval', 'concurrency', 'name'])
      const intervals = _.uniq(data.map(result => result.interval))

      let xValues
      let xTickLabels
      let xAxisKey

      if (intervals.length === 1) {
        this.groupedResultSets = true
        
        if (this.firstDraw) {
          this.selectedResultSets = this.resultSets.map(resultSet => resultSet.text)
        }
        
        data = _.sortBy(this.resultSetsData, ['concurrency', 'name'])

        // this should be sorted same way as computed.resultSets
        xValues = _.uniq(_.flatten(this.resultSetsData.map(result => result.text))).sort()
        xTickLabels = []
        this.resultSets.forEach((resultSet, index) => {
          if (this.selectedResultSets.includes(resultSet.text)) {
            xTickLabels.push(String.fromCharCode(97 + index))
          }
        })
        xAxisKey = 'text'
      } else {
        this.groupedResultSets = false

        xValues = intervals
        xTickLabels = intervals
        xAxisKey = 'interval'
      }

      const minTime = Math.min.apply(undefined, data.map(result => result.time))
      const maxTime = Math.max.apply(undefined, data.map(result => result.time))

      const concurrencies = _.uniq(data.map(result => result.concurrency))
      
      const step = 4
      this.barchart.setupAxes({
        step,
        space: 3,
        xTickLabels,
        zTickLabels: concurrencies
      })

      const cubes = []
      let cnt = 0
      let x = -1 * (xValues.length / 2) * step
      for (let xValue of xValues) {
        let z = -1 * (concurrencies.length / 2) * step
        x += step
        for (let concurrency of concurrencies) {
          z += step
          let h
          let value
          let minMaxReversed = false
          let fn

          const result = data.filter(result => result.concurrency === concurrency && result[xAxisKey] === xValue)[0]
          if (!result) {
            throw new Error(`No result for (${xAxisKey}) '${concurrency}' '${xValue}'`)
          }

          if (this.valueKey === 'totalTime') {
            fn = value => (value / 1000)
          } else if (this.valueKey === 'avgTime') {
            fn = value => (value / result.routes)
          } else if (this.valueKey === 'pages') {
            fn = value => Math.round(result.routes / (value / 1000))
            minMaxReversed = true
          }

          const offset = this.valueKey !== 'pages' && this.minOffset ? minTime : 0
          value = fn(result.time - offset)
          h = -10 * (value / fn((minMaxReversed ? minTime : maxTime) - offset))
          this.minimumValue = Math.round(10 * fn(!minMaxReversed ? minTime : maxTime)) / 10

          const cube = Barchart3D.makeCube(h, x, z)
          cube.id = 'cube_' + this.selectedBenchmark + '_' + cnt++
          cube.value = this.hideValues ? undefined : (result.value !== undefined ? result.value : value)
          
          if (this.valueKey === 'pages') {
            cube.precision = 0
            cube.valueFactor = -h / 10
          } else {
            cube.precision = 1
            cube.valueFactor = h / 10
          }

          cubes.push(cube);
        }
      }

      this.firstDraw = false
      this.barchart.draw(cubes);
    }  
  }
}
</script>

<style>

</style>
