<template>
  <div class="driving-factor">
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="content">
      <h1>{{ drivingFactor.name }}</h1>
      <div class="details-card">
        <div class="description">
          <h3>Description</h3>
          <p>{{ drivingFactor.description }}</p>
        </div>

        <div class="metrics-impacted">
          <h3>Metrics Impacted</h3>
          <ul v-if="drivingFactor.metricsImpacted.length">
            <li v-for="metricId in drivingFactor.metricsImpacted" :key="metricId">
              <router-link :to="{ name: 'metric-details', params: { id: metricId }}">
                {{ getMetricName(metricId) }}
              </router-link>
            </li>
          </ul>
          <p v-else>No metrics impacted</p>
        </div>

        <div class="remediation-actions">
          <h3>Remediation Actions</h3>
          <div v-if="drivingFactor.remediationActions.length" class="remediation-grid">
            <div v-for="action in drivingFactor.remediationActions" :key="action" class="remediation-card">
              <h4>{{ getRemediationActionName(action) }}</h4>
              <p>{{ getRemediationActionDescription(action) }}</p>
            </div>
          </div>
          <p v-else>No remediation actions</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'DrivingFactorView',
  data() {
    return {
      drivingFactor: null,
      loading: true,
      error: null,
      metricNames: {},
      remediationActions: {}
    }
  },
  async created() {
    await this.loadDrivingFactor()
  },
  methods: {
    async loadDrivingFactor() {
      const factorId = this.$route.params.id
      try {
        // Load driving factor details
        const response = await axios.get(`http://localhost:8080/api/metrics/driving-factors/${factorId}`)
        this.drivingFactor = response.data

        // Load all metrics to get names
        const metricsResponse = await axios.get('http://localhost:8080/api/metrics/metrics')
        metricsResponse.data.forEach(metric => {
          this.metricNames[metric.id] = metric.name
        })

        // Load remediation actions to get names and descriptions
        const actionsResponse = await axios.get('http://localhost:8080/api/metrics/remediation-actions')
        actionsResponse.data.forEach(action => {
          this.remediationActions[action.id] = {
            name: action.name,
            description: action.description
          }
        })

        this.loading = false
      } catch (err) {
        this.error = 'Error loading driving factor details: ' + err.message
        this.loading = false
      }
    },
    getMetricName(metricId) {
      return this.metricNames[metricId] || metricId
    },
    getRemediationActionName(actionId) {
      return this.remediationActions[actionId]?.name || actionId
    },
    getRemediationActionDescription(actionId) {
      return this.remediationActions[actionId]?.description || 'No description available'
    }
  },
  watch: {
    '$route.params.id': {
      handler: 'loadDrivingFactor',
      immediate: true
    }
  }
}
</script>

<style scoped>
.driving-factor {
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
  margin-bottom: 20px;
  font-size: 1.2em;
}

.remediation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.remediation-card {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.remediation-card h4 {
  color: #2c3e50;
  margin: 0 0 10px 0;
  font-size: 1.1em;
}

.remediation-card p {
  color: #666;
  margin: 0;
  line-height: 1.5;
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