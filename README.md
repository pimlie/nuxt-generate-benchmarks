## Nuxt Generate Benchmarks

This repo contains benchmarks for generating pages with the default `nuxt generate` command. It's not really prepared for public use, so its likely some code would not pass a code-review ;)

The benchmark results are browseable at: https://pimlie.github.io/nuxt-generate-benchmarks/

### concurrency vs interval

A benchmark to see the correlation between Nuxt's (`v2.2.0`) [`concurrency`](https://nuxtjs.org/api/configuration-generate#concurrency) and [`interval`](https://nuxtjs.org/api/configuration-generate#interval) options for different workloads.

### concurrency method

A benchmark to test several concurrency implementations

### interval throttling

A comparison between API-flooding protection for when you configure an `interval` (see the docs) between the current implementation (`v2.2.0`) and a proposed implementation. The height of the blocks is the duration of the test, the number shown is _the count of `interval` blocks in which more than two pages where generated_. This should be zero.

#### License

This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.
