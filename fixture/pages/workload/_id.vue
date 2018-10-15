<template>
  <h1>Workload: {{ id }}</h1>
</template>

<script>
function sleep(ms) {
  const date = new Date()
  let curDate = null
  do {
    curDate = new Date()
  } while ((curDate - date) < ms)
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms || 0))
}

export default {
  async asyncData({ params, payload }) {
    if (payload) {
      if (payload.workloads) {
        for (let workload of payload.workloads) {
          if (workload.wait) {
            await wait(workload.wait)
          }
          if (workload.block) {
            sleep(workload.block)
          }
        }
      }

      return payload
    }

    return { id: params.id }
  }
}
</script>
