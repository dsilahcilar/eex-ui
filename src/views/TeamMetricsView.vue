<template>
  <div class="team-metrics">
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <h1>{{ teamName }} Metrics</h1>
      
      <!-- Core Values Section -->
      <div class="core-values">
        <h2>Core Values</h2>
        <div class="core-values-grid">
          <div class="core-value-card devex">
            <h3>DevEx Score</h3>
            <div class="value">
              {{ calculateDevExScore() }}
            </div>
            <div class="timestamp">Last updated: {{ getLatestTimestamp() }}</div>
          </div>
          <div class="core-value-card speed">
            <h3>Speed</h3>
            <div class="value">
              {{ formatValue(coreValues.speed?.value) }}
              <span class="trend-indicator" :class="getTrendClass(coreValues.speed?.trend)">
                {{ getTrendSymbol(coreValues.speed?.trend) }}
              </span>
            </div>
            <div class="timestamp">Last updated: {{ formatDate(coreValues.speed?.timestamp) }}</div>
          </div>
          <div class="core-value-card quality">
            <h3>Quality</h3>
            <div class="value">
              {{ formatValue(coreValues.quality?.value) }}
              <span class="trend-indicator" :class="getTrendClass(coreValues.quality?.trend)">
                {{ getTrendSymbol(coreValues.quality?.trend) }}
              </span>
            </div>
            <div class="timestamp">Last updated: {{ formatDate(coreValues.quality?.timestamp) }}</div>
          </div>
          <div class="core-value-card impact">
            <h3>Impact</h3>
            <div class="value">
              {{ formatValue(coreValues.impact?.value) }}
              <span class="trend-indicator" :class="getTrendClass(coreValues.impact?.trend)">
                {{ getTrendSymbol(coreValues.impact?.trend) }}
              </span>
            </div>
            <div class="timestamp">Last updated: {{ formatDate(coreValues.impact?.timestamp) }}</div>
          </div>
        </div>
      </div>

      <!-- Current Values Table -->
      <div class="current-values">
        <h2>Current Values</h2>
        <div class="metrics-table">
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Current Value</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(metric, indicator) in groupedMetrics" :key="indicator">
                <td>
                  <router-link :to="{ name: 'metric-details', params: { id: indicator }}" class="metric-link">
                    {{ getMetricName(indicator) }}
                  </router-link>
                </td>
                <td class="value">{{ formatValue(metric.value) }}</td>
                <td>{{ formatDate(metric.timestamp) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-container">
        <h2>Historical Trends</h2>
        <div class="charts-grid">
          <div v-for="(values, metricId) in groupedData" :key="metricId" class="chart-card">
            <h3 class="chart-title">{{ getMetricName(metricId) }}</h3>
            <div v-if="!values || !values.length" class="no-data">
              No historical data available
            </div>
            <Line
              v-else
              :data="getChartData(values)"
              :options="chartOptions"
              class="chart"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import axios from 'axios'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

export default {
  name: 'TeamMetricsView',
  components: { Line },
  data() {
    return {
      loading: true,
      error: null,
      metricsData: [],
      metricNames: {},
      teamName: '',
      coreValues: {
        speed: null,
        quality: null,
        impact: null
      },
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        }
      }
    }
  },
  async created() {
    try {
      await Promise.all([
        this.loadTeamName(),
        this.loadMetricsData(),
        this.loadMetricNames(),
        this.loadCoreValues()
      ])
      this.loading = false
    } catch (err) {
      this.error = err.message
      this.loading = false
    }
  },
  computed: {
    groupedData() {
      const grouped = {};
      
      // Group metrics by their metricId
      if (Array.isArray(this.metricsData)) {
        this.metricsData.forEach(metricValue => {
          const key = metricValue.metricId;
          if (!grouped[key]) {
            grouped[key] = [];
          }
          grouped[key].push({
            value: metricValue.value,
            timestamp: metricValue.timestamp
          });
        });
      }

      return grouped;
    },
    groupedMetrics() {
      // Get latest value for each metric
      const latestValues = {};
      Object.entries(this.groupedData).forEach(([metricId, values]) => {
        if (!values || !values.length) {
          latestValues[metricId] = { value: 'N/A', timestamp: null };
          return;
        }

        // Sort by timestamp descending and take the first (latest) value
        const sortedValues = [...values].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        latestValues[metricId] = {
          value: sortedValues[0].value,
          timestamp: sortedValues[0].timestamp
        };
      });

      return latestValues;
    }
  },
  methods: {
    async loadTeamName() {
      try {
        const teamId = this.$route.params.id;
        const response = await axios.get(`http://localhost:8080/api/organization/teams/${teamId}`);
        this.teamName = response.data.name;
      } catch (err) {
        console.error('Error loading team name:', err);
        this.teamName = 'Team';  // Fallback if team name can't be loaded
      }
    },
    async loadMetricsData() {
      try {
        const teamId = this.$route.params.id
        const response = await axios.get(`http://localhost:8080/api/metrics/values/team/${teamId}`)
        console.log('Raw Metrics Data:', response.data)
        this.metricsData = response.data
        console.log('Grouped Data:', this.groupedData)
        console.log('Latest Values:', this.groupedMetrics)
        this.loading = false
      } catch (err) {
        this.error = 'Error loading metrics data: ' + err.message
        this.loading = false
      }
    },
    async loadMetricNames() {
      try {
        const response = await axios.get('http://localhost:8080/api/metrics')
        const metrics = response.data
        this.metricNames = metrics.reduce((acc, metric) => {
          acc[metric.id] = metric.name
          return acc
        }, {})
      } catch (err) {
        console.error('Error loading metric names:', err)
      }
    },
    async loadCoreValues() {
      try {
        const teamId = this.$route.params.id;
        const response = await axios.get(`http://localhost:8080/api/metrics/values/core-values/team/${teamId}`);
        const coreValuesData = response.data;
        console.log('Raw Core Values Data:', coreValuesData);

        // Reset core values
        this.coreValues = {
          speed: null,
          quality: null,
          impact: null
        };

        // Define mapping of metric IDs to core values
        const metricMapping = {
          'lead_time_for_changes': 'speed',
          'deployment_frequency': 'speed',
          'change_failure_rate': 'quality',
          'mean_time_to_recovery': 'quality',
          'customer_satisfaction': 'impact',
          'business_value_delivered': 'impact'
        };

        // Group and sort values by metricId
        const groupedValues = {};
        coreValuesData.forEach(value => {
          if (!groupedValues[value.metricId]) {
            groupedValues[value.metricId] = [];
          }
          groupedValues[value.metricId].push(value);
        });

        // Sort values by timestamp and calculate trends
        Object.entries(groupedValues).forEach(([metricId, values]) => {
          const sortedValues = values.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          const coreValueCategory = metricMapping[metricId];
          
          if (coreValueCategory && sortedValues.length > 0) {
            const latestValue = sortedValues[0].value;
            const previousValue = sortedValues[1]?.value;
            
            this.coreValues[coreValueCategory] = {
              value: latestValue,
              timestamp: sortedValues[0].timestamp,
              trend: this.calculateTrend(latestValue, previousValue)
            };
          }
        });

        console.log('Final Core Values State:', this.coreValues);
      } catch (err) {
        console.error('Error loading core values:', err);
        throw err;
      }
    },
    getMetricName(indicator) {
      return this.metricNames[indicator] || `Metric ${indicator}`
    },
    getChartData(data) {
      if (!data || !data.length) {
        return {
          labels: [],
          datasets: [
            {
              label: 'Value',
              data: [],
              borderColor: '#42b983',
              backgroundColor: 'rgba(66, 185, 131, 0.1)',
              borderWidth: 2,
              tension: 0.4,
              fill: true
            }
          ]
        }
      }
      
      const sortedData = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      
      return {
        labels: sortedData.map(item => new Date(item.timestamp).toLocaleString()),
        datasets: [
          {
            label: 'Value',
            data: sortedData.map(item => item.value),
            borderColor: '#42b983',
            backgroundColor: 'rgba(66, 185, 131, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true
          }
        ]
      }
    },
    formatValue(value) {
      if (value === null || value === undefined) return 'N/A'
      return typeof value === 'number' ? value.toFixed(2) : value.toString()
    },
    formatDate(timestamp) {
      if (!timestamp) return 'N/A'
      return new Date(timestamp).toLocaleString()
    },
    getTrendSymbol(trend) {
      if (!trend) return '';
      switch (trend) {
        case 'up': return '↑';
        case 'down': return '↓';
        case 'neutral': return '→';
        default: return '';
      }
    },
    getTrendClass(trend) {
      if (!trend) return '';
      return `trend-${trend}`;
    },
    calculateTrend(currentValue, previousValue) {
      if (!currentValue || !previousValue) return null;
      if (currentValue > previousValue) return 'up';
      if (currentValue < previousValue) return 'down';
      return 'neutral';
    },
    calculateDevExScore() {
      const values = [
        this.coreValues.speed?.value,
        this.coreValues.quality?.value,
        this.coreValues.impact?.value
      ];
      
      // Filter out null/undefined values and sum them
      const sum = values
        .filter(value => value !== null && value !== undefined)
        .reduce((acc, curr) => acc + curr, 0);
      
      return this.formatValue(sum);
    },
    getLatestTimestamp() {
      const timestamps = [
        this.coreValues.speed?.timestamp,
        this.coreValues.quality?.timestamp,
        this.coreValues.impact?.timestamp
      ].filter(Boolean);
      
      if (!timestamps.length) return 'N/A';
      
      // Get the most recent timestamp
      const latestTimestamp = new Date(Math.max(...timestamps.map(t => new Date(t))));
      return this.formatDate(latestTimestamp);
    }
  }
}
</script>

<style scoped>
.team-metrics {
  padding: 20px;
  max-width: 1600px;
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

h1, h2 {
  color: #2c3e50;
  margin-bottom: 20px;
}

.current-values {
  margin-bottom: 40px;
}

.metrics-table {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px 20px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background: #f8f9fa;
  font-weight: 600;
  color: #2c3e50;
}

td {
  color: #666;
}

td.value {
  font-weight: bold;
  color: #42b983;
}

.metric-link {
  color: #2c3e50;
  text-decoration: none;
  font-weight: 500;
}

.metric-link:hover {
  color: #42b983;
}

.chart {
  position: relative;
  width: 100%;
  height: 300px !important;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 20px;
}

.chart-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-height: 350px;
}

.chart-title {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 1.1em;
}

.no-data {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-style: italic;
  background: #f8f8f8;
  border-radius: 4px;
  margin-top: 10px;
}

.core-values {
  margin-bottom: 40px;
}

.core-values-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-top: 20px;
}

.core-value-card {
  background: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.core-value-card h3 {
  color: #2c3e50;
  margin: 0 0 10px 0;
  font-size: 1.1em;
}

.core-value-card .value {
  font-size: 1.6em;
  font-weight: bold;
  color: #42b983;
  margin-bottom: 8px;
}

.core-value-card .timestamp {
  font-size: 0.8em;
  color: #666;
}

.core-value-card.speed {
  border-top: 4px solid #42b983;
}

.core-value-card.devex {
  border-top: 4px solid #7957d5;
}

.core-value-card.quality {
  border-top: 4px solid #7957d5;
}

.core-value-card.impact {
  border-top: 4px solid #ff9f43;
}

.trend-indicator {
  display: inline-block;
  margin-left: 8px;
  font-size: 0.8em;
}

.trend-up {
  color: #42b983;
}

.trend-down {
  color: #ff4757;
}

.trend-neutral {
  color: #7f8c8d;
}
</style> 