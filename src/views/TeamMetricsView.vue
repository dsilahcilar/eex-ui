<template>
  <div class="team-metrics">
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <h1>Team Metrics</h1>
      
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
    await Promise.all([
      this.loadMetricsData(),
      this.loadMetricNames()
    ])
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
</style> 