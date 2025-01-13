<template>
  <div class="graph-view">
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="content">
      <div class="header">
        <div class="title-section">
          <h1>Metrics Relationship Graph</h1>
          <button v-if="isFiltered" class="reset-button" @click="resetGraph">
            Reset View
          </button>
        </div>
        <div class="legend">
          <div class="legend-section">
            <h4>Nodes</h4>
            <div class="legend-item" @click="filterByType('METRIC')" :class="{ active: activeTypeFilter === 'METRIC' }">
              <span class="dot metric"></span> Metrics
            </div>
            <div class="legend-item" @click="filterByType('DRIVING_FACTOR')" :class="{ active: activeTypeFilter === 'DRIVING_FACTOR' }">
              <span class="dot driving-factor"></span> Driving Factors
            </div>
            <div class="legend-item" @click="filterByType('REMEDIATION_ACTION')" :class="{ active: activeTypeFilter === 'REMEDIATION_ACTION' }">
              <span class="dot remediation"></span> Remediation Actions
            </div>
          </div>
          <div class="legend-section">
            <h4>Relationships</h4>
            <div class="legend-item">
              <span class="line impacts"></span> Impacts
            </div>
            <div class="legend-item">
              <span class="line remediated"></span> Remediated by
            </div>
            <div class="legend-item">
              <span class="line leads"></span> Leads to
            </div>
            <div class="legend-item">
              <span class="line lags"></span> Lags behind
            </div>
          </div>
        </div>
      </div>
      <div class="graph-container" ref="graphContainer"></div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { Network } from 'vis-network'
import { DataSet } from 'vis-data'
import 'vis-network/styles/vis-network.css'

const COLORS = {
  METRIC: {
    background: '#42b983',
    border: '#2c8c62'
  },
  DRIVING_FACTOR: {
    background: '#7957d5',
    border: '#5a3fb1'
  },
  REMEDIATION_ACTION: {
    background: '#ff9f43',
    border: '#db7722'
  }
}

const EDGE_COLORS = {
  IMPACTS: '#e74c3c',
  REMEDIATED_BY: '#f39c12',
  LEADS_TO: '#42b983',
  LAGS_BEHIND: '#7957d5'
}

export default {
  name: 'GraphView',
  data() {
    return {
      loading: true,
      error: null,
      network: null,
      graphData: null,
      resizeHandler: null,
      filteredNodes: null,
      filteredEdges: null,
      isFiltered: false,
      activeTypeFilter: null
    }
  },
  async created() {
    await this.loadGraphData()
  },
  methods: {
    getNodeColor(type) {
      return COLORS[type] || COLORS.METRIC
    },
    getEdgeColor(type) {
      return EDGE_COLORS[type] || '#666666'
    },
    getEdgeLabel(type) {
      switch (type) {
        case 'IMPACTS':
          return 'Impacts'
        case 'REMEDIATED_BY':
          return 'Remediated by'
        case 'LEADS_TO':
          return 'Leads to'
        case 'LAGS_BEHIND':
          return 'Lags behind'
        default:
          return type
      }
    },
    async loadGraphData() {
      try {
        const response = await axios.get('http://localhost:8080/api/graph/relationships')
        this.graphData = response.data
        this.loading = false
        this.$nextTick(() => {
          this.initializeGraph()
        })
      } catch (err) {
        this.error = 'Error loading graph data: ' + err.message
        this.loading = false
      }
    },
    initializeGraph() {
      const container = this.$refs.graphContainer
      
      // Store the initial data for reset functionality
      this.filteredNodes = this.graphData.nodes
      this.filteredEdges = this.graphData.edges
      
      // Create nodes and edges with the filtered data
      const nodes = new DataSet(
        this.filteredNodes.map(node => {
          const colors = this.getNodeColor(node.type)
          return {
            id: node.id,
            label: node.label,
            title: `${node.label}\nType: ${node.type.replace('_', ' ')}\n\n${node.description}`,
            color: {
              background: colors.background,
              border: colors.border,
              highlight: {
                background: colors.background,
                border: colors.border
              }
            },
            font: {
              size: 14,
              color: '#2c3e50',
              face: 'Avenir, Helvetica, Arial',
              multi: true,
              mod: 'bold'
            },
            shape: node.type === 'METRIC' ? 'dot' : (node.type === 'DRIVING_FACTOR' ? 'diamond' : 'hexagon'),
            size: node.type === 'METRIC' ? 30 : 35,
            margin: 12
          }
        })
      )

      const edges = new DataSet(
        this.filteredEdges.map(edge => ({
          from: edge.source,
          to: edge.target,
          arrows: {
            to: {
              enabled: true,
              scaleFactor: 1
            }
          },
          color: {
            color: this.getEdgeColor(edge.type),
            highlight: this.getEdgeColor(edge.type),
            hover: this.getEdgeColor(edge.type)
          },
          label: this.getEdgeLabel(edge.type),
          font: {
            size: 12,
            color: this.getEdgeColor(edge.type),
            align: 'middle'
          },
          smooth: {
            type: 'curvedCW',
            roundness: 0.2
          },
          width: 3
        }))
      )

      const options = {
        nodes: {
          borderWidth: 3,
          shadow: true,
          font: {
            size: 14,
            color: '#2c3e50',
            face: 'Avenir, Helvetica, Arial',
            bold: {
              color: '#2c3e50',
              size: 14,
              face: 'Avenir, Helvetica, Arial',
              mod: 'bold'
            }
          },
          scaling: {
            label: {
              enabled: true,
              min: 14,
              max: 24
            }
          },
          labelHighlightBold: true
        },
        edges: {
          shadow: true,
          font: {
            size: 12,
            face: 'Avenir, Helvetica, Arial'
          }
        },
        physics: {
          enabled: true,
          stabilization: {
            enabled: true,
            iterations: 200,
            updateInterval: 50
          },
          barnesHut: {
            gravitationalConstant: -10000,
            springConstant: 0.04,
            springLength: 250,
            avoidOverlap: 0.5
          }
        },
        interaction: {
          hover: true,
          tooltipDelay: 200,
          zoomView: true,
          dragView: true,
          hideEdgesOnDrag: true,
          hideEdgesOnZoom: true
        },
        layout: {
          improvedLayout: true,
          hierarchical: false
        },
        autoResize: false
      }

      // Create network instance
      this.network = new Network(container, { nodes, edges }, options)

      // Handle resize events manually
      const resizeHandler = () => {
        if (this.network) {
          const newHeight = window.innerHeight - 120 // Adjust for padding and header
          container.style.height = `${newHeight}px`
          this.network.setSize(container.offsetWidth, newHeight)
          this.network.redraw()
        }
      }

      // Initial resize
      resizeHandler()

      // Add resize listener
      window.addEventListener('resize', resizeHandler)
      
      // Store resize handler for cleanup
      this.resizeHandler = resizeHandler

      // Add click handler for filtering
      this.network.on('click', (params) => {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0]
          // Always filter to show only connected nodes
          this.filterGraph(nodeId)
        } else if (params.edges.length === 0) {
          // Click on empty space resets the graph
          this.resetGraph()
        }
      })

      // Fit the graph to the container with some padding
      this.network.once('stabilized', () => {
        setTimeout(() => {
          this.network.fit({
            animation: {
              duration: 1000,
              easingFunction: 'easeInOutQuad'
            }
          })
        }, 500)
      })
    },

    filterGraph(nodeId) {
      // Find all connected edges
      const connectedEdges = this.graphData.edges.filter(edge => 
        edge.source === nodeId || edge.target === nodeId
      )

      // Get all connected node IDs
      const connectedNodeIds = new Set([nodeId])
      connectedEdges.forEach(edge => {
        connectedNodeIds.add(edge.source)
        connectedNodeIds.add(edge.target)
      })

      // Filter nodes and edges
      this.filteredNodes = this.graphData.nodes.filter(node => 
        connectedNodeIds.has(node.id)
      )
      this.filteredEdges = connectedEdges

      // Update the graph
      this.updateGraphData()
      this.isFiltered = true
    },

    resetGraph() {
      this.filteredNodes = this.graphData.nodes
      this.filteredEdges = this.graphData.edges
      this.updateGraphData()
      this.isFiltered = false
      this.activeTypeFilter = null
    },

    updateGraphData() {
      // Destroy existing network
      if (this.network) {
        this.network.destroy()
      }

      const container = this.$refs.graphContainer
      
      const nodes = new DataSet(
        this.filteredNodes.map(node => {
          const colors = this.getNodeColor(node.type)
          return {
            id: node.id,
            label: node.label,
            title: `${node.label}\nType: ${node.type.replace('_', ' ')}\n\n${node.description}`,
            color: {
              background: colors.background,
              border: colors.border,
              highlight: {
                background: colors.background,
                border: colors.border
              }
            },
            font: {
              size: 14,
              color: '#2c3e50',
              face: 'Avenir, Helvetica, Arial',
              multi: true,
              mod: 'bold'
            },
            shape: node.type === 'METRIC' ? 'dot' : (node.type === 'DRIVING_FACTOR' ? 'diamond' : 'hexagon'),
            size: node.type === 'METRIC' ? 30 : 35,
            margin: 12
          }
        })
      )

      const edges = new DataSet(
        this.filteredEdges.map(edge => ({
          from: edge.source,
          to: edge.target,
          arrows: {
            to: {
              enabled: true,
              scaleFactor: 1
            }
          },
          color: {
            color: this.getEdgeColor(edge.type),
            highlight: this.getEdgeColor(edge.type),
            hover: this.getEdgeColor(edge.type)
          },
          label: this.getEdgeLabel(edge.type),
          font: {
            size: 12,
            color: this.getEdgeColor(edge.type),
            align: 'middle'
          },
          smooth: {
            type: 'curvedCW',
            roundness: 0.2
          },
          width: 3
        }))
      )

      const options = {
        nodes: {
          borderWidth: 3,
          shadow: true,
          font: {
            size: 14,
            color: '#2c3e50',
            face: 'Avenir, Helvetica, Arial',
            bold: {
              color: '#2c3e50',
              size: 14,
              face: 'Avenir, Helvetica, Arial',
              mod: 'bold'
            }
          },
          scaling: {
            label: {
              enabled: true,
              min: 14,
              max: 24
            }
          },
          labelHighlightBold: true
        },
        edges: {
          shadow: true,
          font: {
            size: 12,
            face: 'Avenir, Helvetica, Arial'
          }
        },
        physics: {
          enabled: true,
          stabilization: {
            enabled: true,
            iterations: 200,
            updateInterval: 50
          },
          barnesHut: {
            gravitationalConstant: -10000,
            springConstant: 0.04,
            springLength: 250,
            avoidOverlap: 0.5
          }
        },
        interaction: {
          hover: true,
          tooltipDelay: 200,
          zoomView: true,
          dragView: true,
          hideEdgesOnDrag: true,
          hideEdgesOnZoom: true
        },
        layout: {
          improvedLayout: true,
          hierarchical: false
        },
        autoResize: false
      }

      // Create new network instance
      this.network = new Network(container, { nodes, edges }, options)

      // Add click handler for filtering
      this.network.on('click', (params) => {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0]
          // Always filter to show only connected nodes
          this.filterGraph(nodeId)
        } else if (params.edges.length === 0) {
          // Click on empty space resets the graph
          this.resetGraph()
        }
      })
      
      // Fit view to show all nodes
      setTimeout(() => {
        this.network.fit({
          animation: {
            duration: 1000,
            easingFunction: 'easeInOutQuad'
          }
        })
      }, 50)
    },

    filterByType(type) {
      if (this.activeTypeFilter === type) {
        // If clicking the same type again, reset the filter
        this.activeTypeFilter = null;
        this.resetGraph();
      } else {
        this.activeTypeFilter = type;
        // Filter nodes by type
        this.filteredNodes = this.graphData.nodes.filter(node => node.type === type);
        
        // Get all edges that connect to these nodes
        const nodeIds = new Set(this.filteredNodes.map(node => node.id));
        this.filteredEdges = this.graphData.edges.filter(edge => 
          nodeIds.has(edge.source) && nodeIds.has(edge.target)
        );
        
        this.updateGraphData();
        this.isFiltered = true;
      }
    }
  },
  beforeUnmount() {
    // Clean up
    if (this.network) {
      this.network.destroy()
      this.network = null
    }
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler)
    }
  }
}
</script>

<style scoped>
.graph-view {
  padding: 20px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; /* Important for Firefox */
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-shrink: 0; /* Prevent header from shrinking */
}

.loading, .error {
  text-align: center;
  margin: 20px;
  font-size: 1.2em;
}

.error {
  color: red;
}

h1 {
  color: #2c3e50;
  margin: 0;
}

.graph-container {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden; /* Contain the network canvas */
  position: relative; /* For proper canvas positioning */
}

.legend {
  display: flex;
  gap: 30px;
  background: white;
  padding: 15px 25px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.legend-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-section h4 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 0.9em;
  font-weight: bold;
}

.legend-item {
  display: flex;
  align-items: center;
  color: #666;
  font-size: 0.9em;
  white-space: nowrap;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.legend-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.legend-item.active {
  background-color: rgba(66, 185, 131, 0.1);
  color: #42b983;
}

.dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  margin-right: 8px;
}

.dot.metric {
  background: #42b983;
  border: 3px solid #2c8c62;
}

.dot.driving-factor {
  background: #7957d5;
  border: 3px solid #5a3fb1;
}

.dot.remediation {
  background: #ff9f43;
  border: 3px solid #db7722;
}

.line {
  width: 24px;
  height: 3px;
  margin-right: 8px;
}

.line.impacts {
  background: #e74c3c;
}

.line.remediated {
  background: #f39c12;
}

.line.leads {
  background: #42b983;
}

.line.lags {
  background: #7957d5;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 15px;
}

.reset-button {
  background-color: #42b983;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 0.9em;
  cursor: pointer;
  transition: background-color 0.2s;
}

.reset-button:hover {
  background-color: #3aa876;
}
</style> 