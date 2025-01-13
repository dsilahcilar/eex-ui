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

        <div class="type-info">
          <div class="type">
            <h3>Type</h3>
            <p>{{ formatType(drivingFactor.type) }}</p>
          </div>
          <div class="subcategory">
            <h3>Subcategory</h3>
            <p>{{ drivingFactor.subcategory }}</p>
          </div>
        </div>

        <div class="impact-areas">
          <h3>Impact Areas</h3>
          <ul v-if="drivingFactor.impactAreas.length">
            <li v-for="area in drivingFactor.impactAreas" :key="area">{{ area }}</li>
          </ul>
          <p v-else>No impact areas specified</p>
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
          <div v-if="drivingFactor.remediationActionLinks.length" class="remediation-grid">
            <div v-for="actionLink in drivingFactor.remediationActionLinks" :key="actionLink.remediationActionId" 
                 class="remediation-card" :class="{ primary: actionLink.primary }">
              <div class="action-header">
                <h4>{{ getRemediationActionName(actionLink.remediationActionId) }}</h4>
                <span class="impact-badge" :class="actionLink.impact.toLowerCase()">
                  {{ actionLink.impact }}
                </span>
                <span v-if="actionLink.primary" class="primary-badge">Primary</span>
              </div>
              <p>{{ getRemediationActionDescription(actionLink.remediationActionId) }}</p>
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
        const metricsResponse = await axios.get('http://localhost:8080/api/metrics')
        metricsResponse.data.forEach(metric => {
          this.metricNames[metric.id] = metric.name
        })

        // Load remediation actions to get names and descriptions
        const actionsResponse = await axios.get('http://localhost:8080/api/metrics/remediation-actions')
        actionsResponse.data.forEach(action => {
          this.remediationActions[action.id] = {
            name: action.name,
            description: action.description,
            type: action.type
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
    },
    formatType(type) {
      return type.charAt(0) + type.slice(1).toLowerCase().replace('_', ' ')
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

.type-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.impact-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8em;
  font-weight: bold;
  text-transform: uppercase;
}

.impact-badge.low {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.impact-badge.medium {
  background-color: #fff3e0;
  color: #f57c00;
}

.impact-badge.high {
  background-color: #ffebee;
  color: #c62828;
}

.primary-badge {
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8em;
  font-weight: bold;
  margin-left: 8px;
}

.action-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.action-header h4 {
  margin: 0;
  flex-grow: 1;
}

.remediation-card.primary {
  border: 2px solid #1976d2;
}
</style> 