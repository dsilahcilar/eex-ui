import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import TeamsView from '../views/TeamsView.vue'
import TeamMetricsView from '../views/TeamMetricsView.vue'
import MetricDetailsView from '../views/MetricDetailsView.vue'
import DrivingFactorView from '../views/DrivingFactorView.vue'
import GraphView from '../views/GraphView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/teams',
    name: 'teams',
    component: TeamsView
  },
  {
    path: '/teams/:id/metrics',
    name: 'team-metrics',
    component: TeamMetricsView
  },
  {
    path: '/metrics/:id',
    name: 'metric-details',
    component: MetricDetailsView
  },
  {
    path: '/driving-factors/:id',
    name: 'driving-factor',
    component: DrivingFactorView
  },
  {
    path: '/graph',
    name: 'graph',
    component: GraphView
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router 