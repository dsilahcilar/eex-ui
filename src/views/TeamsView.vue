<template>
  <div class="teams">
    <h1>Teams</h1>
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="teams-grid">
      <div v-for="team in teams" :key="team.id" class="team-card">
        <h3>
          <router-link :to="{ name: 'team-metrics', params: { id: team.id }}" class="team-name">
            {{ team.name }}
          </router-link>
        </h3>
        <p>{{ team.description }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'TeamsView',
  data() {
    return {
      teams: [],
      loading: true,
      error: null
    }
  },
  async created() {
    try {
      const response = await axios.get('http://localhost:8080/api/organization/teams')
      this.teams = response.data
      this.loading = false
    } catch (err) {
      this.error = 'Error loading teams: ' + err.message
      this.loading = false
    }
  }
}
</script>

<style scoped>
.teams {
  padding: 20px;
}

.loading, .error {
  text-align: center;
  margin: 20px;
  font-size: 1.2em;
}

.error {
  color: red;
}

.teams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px;
}

.team-card {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.team-card h3 {
  margin-top: 0;
}

.team-card h3 a {
  color: #2c3e50;
  text-decoration: none;
}

.team-card h3 a:hover {
  color: #42b983;
}

.team-card p {
  color: #666;
}
</style> 