<template>
  <div class="metric-details">
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="content">
      <h1>{{ metric.name }}</h1>
      <div class="details-card">
        <div class="description">
          <h3>Description</h3>
          <p>{{ metric.description }}</p>
        </div>
        <div class="type">
          <h3>Type</h3>
          <p>{{ metric.type }}</p>
        </div>
        <div class="driving-factors">
          <h3>Driving Factors</h3>
          <ul v-if="metric.drivingFactors.length">
            <li v-for="factor in metric.drivingFactors" :key="factor">
              <router-link :to="{ name: 'driving-factor', params: { id: factor }}">
                {{ getDrivingFactorName(factor) }}
              </router-link>
            </li>
          </ul>
          <p v-else>No driving factors</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'MetricDetailsView',
  data() {
    return {
      metric: null,
      loading: true,
      error: null,
      metricNames: {}, // Cache for metric names
      drivingFactorNames: {} // Cache for driving factor names
    }
  },
  async created() {
    await this.loadMetric()
  },
  methods: {
    async loadMetric() {
      const metricId = this.$route.params.id
      try {
        // Load metric details
        const response = await axios.get(`http://localhost:8080/api/metrics/${metricId}`)
        this.metric = response.data

        // Load all metrics to get names for relationships
        const metricsResponse = await axios.get('http://localhost:8080/api/metrics')
        metricsResponse.data.forEach(metric => {
          this.metricNames[metric.id] = metric.name
        })

        // Load all driving factors to get names
        const factorsResponse = await axios.get('http://localhost:8080/api/metrics/driving-factors')
        factorsResponse.data.forEach(factor => {
          this.drivingFactorNames[factor.id] = factor.name
        })

        this.loading = false
      } catch (err) {
        this.error = 'Error loading metric details: ' + err.message
        this.loading = false
      }
    },
    getMetricName(metricId) {
      return this.metricNames[metricId] || metricId
    },
    getDrivingFactorName(factorId) {
      return this.drivingFactorNames[factorId] || factorId
    }
  },
  watch: {
    '$route.params.id': {
      handler: 'loadMetric',
      immediate: true
    }
  }
}
</script>

<style scoped>
.metric-details {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.loading, .error {
  text-align: center;
  margin: 20px;
  font-size: 1.2em;
}

.error {
  color: red;
}

.content h1 {
  color: #2c3e50;
  margin-bottom: 30px;
}

.details-card {
  background: white;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.details-card > div {
  margin-bottom: 30px;
}

.details-card > div:last-child {
  margin-bottom: 0;
}

.details-card h3 {
  color: #42b983;
  margin-bottom: 10px;
  font-size: 1.2em;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

li {
  margin: 8px 0;
}

a {
  color: #42b983;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

.description p {
  line-height: 1.6;
}
</style> 