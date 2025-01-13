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
                 class="remediation-card" :class="{ primary: actionLink.isPrimary }">
              <div class="action-header">
                <h4>{{ getRemediationActionName(actionLink.remediationActionId) }}</h4>
                <span class="impact-badge" :class="actionLink.impact.toLowerCase()">
                  {{ actionLink.impact }}
                </span>
                <span v-if="actionLink.isPrimary" class="primary-badge">Primary</span>
              </div>
              <div class="action-content">
                <p class="description">{{ getRemediationActionDescription(actionLink.remediationActionId) }}</p>
                
                <div class="action-details">
                  <div class="detail-row">
                    <span class="detail-label">Type:</span>
                    <span class="detail-value">{{ formatType(getRemediationActionType(actionLink.remediationActionId)) }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Implementation Complexity:</span>
                    <span class="detail-value complexity-badge" :class="getRemediationActionComplexity(actionLink.remediationActionId).toLowerCase()">
                      {{ getRemediationActionComplexity(actionLink.remediationActionId) }}
                    </span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Time Investment:</span>
                    <span class="detail-value investment-badge" :class="getRemediationActionTimeInvestment(actionLink.remediationActionId).toLowerCase()">
                      {{ getRemediationActionTimeInvestment(actionLink.remediationActionId) }}
                    </span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Cost Investment:</span>
                    <span class="detail-value investment-badge" :class="getRemediationActionCostInvestment(actionLink.remediationActionId).toLowerCase()">
                      {{ getRemediationActionCostInvestment(actionLink.remediationActionId) }}
                    </span>
                  </div>
                </div>

                <div class="action-section">
                  <h5>Expected Outcomes</h5>
                  <ul class="outcome-list">
                    <li v-for="(outcome, index) in getRemediationActionOutcomes(actionLink.remediationActionId)" 
                        :key="index">{{ outcome }}</li>
                  </ul>
                </div>

                <div class="action-section">
                  <h5>Implementation Steps</h5>
                  <ol class="step-list">
                    <li v-for="(step, index) in getRemediationActionSteps(actionLink.remediationActionId)" 
                        :key="index">{{ step }}</li>
                  </ol>
                </div>

                <div class="action-section">
                  <h5>Success Metrics</h5>
                  <ul class="metric-list">
                    <li v-for="metric in getRemediationActionSuccessMetrics(actionLink.remediationActionId)" 
                        :key="metric">{{ metric }}</li>
                  </ul>
                </div>

                <div class="action-section">
                  <h5>Resources Needed</h5>
                  <ul class="resource-list">
                    <li v-for="(resource, index) in getRemediationActionResources(actionLink.remediationActionId)" 
                        :key="index">{{ resource }}</li>
                  </ul>
                </div>
              </div>
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
            type: action.type,
            implementationComplexity: action.implementationComplexity,
            timeInvestment: action.timeInvestment,
            costInvestment: action.costInvestment,
            expectedOutcomes: action.expectedOutcomes,
            implementationSteps: action.implementationSteps,
            successMetrics: action.successMetrics,
            resourcesNeeded: action.resourcesNeeded
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
    },
    getRemediationActionType(actionId) {
      return this.remediationActions[actionId]?.type || 'Unknown'
    },
    getRemediationActionComplexity(actionId) {
      return this.remediationActions[actionId]?.implementationComplexity || 'Unknown'
    },
    getRemediationActionTimeInvestment(actionId) {
      return this.remediationActions[actionId]?.timeInvestment || 'Unknown'
    },
    getRemediationActionCostInvestment(actionId) {
      return this.remediationActions[actionId]?.costInvestment || 'Unknown'
    },
    getRemediationActionOutcomes(actionId) {
      return this.remediationActions[actionId]?.expectedOutcomes || []
    },
    getRemediationActionSteps(actionId) {
      return this.remediationActions[actionId]?.implementationSteps || []
    },
    getRemediationActionSuccessMetrics(actionId) {
      return this.remediationActions[actionId]?.successMetrics || []
    },
    getRemediationActionResources(actionId) {
      return this.remediationActions[actionId]?.resourcesNeeded || []
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
  background: white;
  border-radius: 8px;
  padding: 25px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
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

.action-content {
  margin-top: 15px;
}

.action-details {
  background: #f1f5f9;
  border-radius: 4px;
  padding: 15px;
  margin: 15px 0;
}

.detail-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-weight: 600;
  color: #475569;
  width: 180px;
}

.detail-value {
  color: #1e293b;
}

.complexity-badge, .investment-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.9em;
  font-weight: 500;
  text-transform: lowercase;
}

.complexity-badge.low, .investment-badge.low {
  background-color: #dcfce7;
  color: #166534;
}

.complexity-badge.medium, .investment-badge.medium {
  background-color: #fef3c7;
  color: #92400e;
}

.complexity-badge.high, .investment-badge.high {
  background-color: #fee2e2;
  color: #991b1b;
}

.action-section {
  margin-top: 20px;
}

.action-section h5 {
  color: #475569;
  font-size: 1em;
  margin-bottom: 10px;
}

.outcome-list, .step-list, .metric-list, .resource-list {
  margin: 0;
  padding-left: 20px;
}

.outcome-list li, .metric-list li, .resource-list li {
  margin: 5px 0;
  color: #475569;
}

.step-list li {
  margin: 8px 0;
  color: #475569;
  padding-left: 5px;
}

.description {
  color: #475569;
  line-height: 1.6;
  margin-bottom: 20px;
}
</style> 