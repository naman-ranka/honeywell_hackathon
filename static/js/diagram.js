/**
 * TwinMaker Configurator - Diagram Visualizations
 * Adds interactive diagrams and visualizations to the TwinMaker Configurator UI
 */

document.addEventListener('DOMContentLoaded', () => {
    // Load the main process flow diagram
    fetch('/static/css/twinmaker-flow.svg')
        .then(response => response.text())
        .then(svg => {
            const diagramContainer = document.getElementById('flowDiagramContainer');
            if (diagramContainer) {
                diagramContainer.innerHTML = svg;
                initializeDiagramInteractions();
            }
        })
        .catch(error => console.error('Error loading SVG diagram:', error));

    // Initialize component relationship diagram
    initializeComponentDiagram();
});

/**
 * Adds hover interactions to the process flow diagram
 */
function initializeDiagramInteractions() {
    // Get SVG document from the container
    const svgDoc = document.querySelector('#flowDiagramContainer svg');
    if (!svgDoc) return;

    // Define the interactive elements and their descriptions
    const interactiveElements = [
        { selector: 'rect[x="50"][y="150"]', description: 'Start by describing your factory in natural language' },
        { selector: 'rect[x="270"][y="150"]', description: 'Gemini AI processes your description using advanced natural language understanding' },
        { selector: 'rect[x="490"][y="150"]', description: 'Structured JSON configurations are generated for all TwinMaker components' },
        { selector: 'rect[x="490"][y="290"]', description: 'Configurations are provisioned to your AWS account' },
        { selector: 'rect[x="130"][y="290"]', description: 'Six component types form your complete digital twin' }
    ];

    // Get the tooltip element or create one if it doesn't exist
    let tooltip = document.getElementById('diagramTooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'diagramTooltip';
        tooltip.className = 'diagram-tooltip';
        document.body.appendChild(tooltip);
    }

    // Add event listeners to each interactive element
    interactiveElements.forEach(item => {
        const elements = svgDoc.querySelectorAll(item.selector);
        elements.forEach(el => {
            // Highlight on hover
            el.addEventListener('mouseenter', () => {
                el.style.opacity = '0.7';
                el.style.cursor = 'pointer';
                
                // Show tooltip
                tooltip.textContent = item.description;
                tooltip.style.display = 'block';
                
                // Position tooltip near the cursor
                document.addEventListener('mousemove', updateTooltipPosition);
            });
            
            // Remove highlight on mouse leave
            el.addEventListener('mouseleave', () => {
                el.style.opacity = '1';
                tooltip.style.display = 'none';
                document.removeEventListener('mousemove', updateTooltipPosition);
            });
            
            // Pulse animation on click
            el.addEventListener('click', () => {
                el.classList.add('pulse-animation');
                setTimeout(() => {
                    el.classList.remove('pulse-animation');
                }, 1000);
            });
        });
    });
}

/**
 * Updates tooltip position to follow cursor
 */
function updateTooltipPosition(event) {
    const tooltip = document.getElementById('diagramTooltip');
    if (tooltip) {
        tooltip.style.left = (event.pageX + 15) + 'px';
        tooltip.style.top = (event.pageY + 15) + 'px';
    }
}

/**
 * Creates an interactive component relationship diagram 
 * showing how TwinMaker components relate to each other
 */
function initializeComponentDiagram() {
    const componentDiagram = document.getElementById('componentDiagramContainer');
    if (!componentDiagram) return;

    // Load visualization library if not already loaded
    if (typeof d3 === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://d3js.org/d3.v7.min.js';
        script.onload = createComponentDiagram;
        document.head.appendChild(script);
    } else {
        createComponentDiagram();
    }
}

/**
 * Creates a force-directed graph showing component relationships
 */
function createComponentDiagram() {
    // Component relationships data
    const data = {
        nodes: [
            { id: "workspace", label: "Workspace", group: 1 },
            { id: "componentTypes", label: "Component Types", group: 2 },
            { id: "entities", label: "Entities", group: 3 },
            { id: "assets", label: "Assets", group: 4 },
            { id: "scene", label: "Scene", group: 5 },
            { id: "connections", label: "Connections", group: 6 }
        ],
        links: [
            { source: "workspace", target: "componentTypes", value: 3 },
            { source: "workspace", target: "scene", value: 2 },
            { source: "componentTypes", target: "entities", value: 5 },
            { source: "entities", target: "assets", value: 2 },
            { source: "entities", target: "scene", value: 3 },
            { source: "entities", target: "connections", value: 4 },
            { source: "scene", target: "connections", value: 2 }
        ]
    };

    // Set up SVG container
    const container = document.getElementById('componentDiagramContainer');
    const width = container.clientWidth;
    const height = 300;

    // Clear any existing content
    container.innerHTML = '';

    // Create SVG element
    const svg = d3.select(container)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto;");

    // Define forces
    const simulation = d3.forceSimulation(data.nodes)
        .force("link", d3.forceLink(data.links).id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2));

    // Create links
    const link = svg.append("g")
        .selectAll("line")
        .data(data.links)
        .join("line")
        .attr("stroke", "#0066CC")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", d => Math.sqrt(d.value));

    // Create nodes
    const node = svg.append("g")
        .selectAll("g")
        .data(data.nodes)
        .join("g")
        .call(drag(simulation));

    // Add circles to nodes
    node.append("circle")
        .attr("r", 20)
        .attr("fill", d => {
            const colors = ["#0066CC", "#0099FF", "#00CCFF", "#00EEFF", "#0AC5FF", "#14ADFF"];
            return colors[d.group - 1];
        });

    // Add labels to nodes
    node.append("text")
        .text(d => d.label)
        .attr("x", 0)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .attr("fill", "#102A43")
        .style("font-family", "'Inter', system-ui, sans-serif")
        .style("font-size", "10px")
        .style("font-weight", "600");

    // Update positions on tick
    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Drag functionality
    function drag(simulation) {
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }
        
        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }
        
        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }
        
        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }
} 