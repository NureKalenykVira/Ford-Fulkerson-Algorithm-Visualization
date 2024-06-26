document.addEventListener('DOMContentLoaded', () => {
    const svg = d3.select("#graph-svg").attr("width", 600).attr("height", 600);
    const width = +svg.attr("width");
    const height = +svg.attr("height");

    let nodes = [];
    let edges = [];
    let nodeCount = 0;
    let currentStep = 0;
    let algorithmSteps = [];
    let sourceNode = null;
    let sinkNode = null;
    let graph;
    let parent = {};
    let maxFlow = 0;
    let isInitialized = false; // Track initialization state
    let path = []; // To store the current path
    let isPathFound = false; // Track if a path is found
    let pathFlow = 0; // Track the path flow
    let allPathFlows = []; // Store all path flows

    const addNodeBtn = document.getElementById('add-node-btn');
    const addEdgeBtn = document.getElementById('add-edge-btn');
    const runAlgorithmBtn = document.getElementById('run-algorithm-btn');
    const backBtn = document.getElementById('back-btn');
    const forwardBtn = document.getElementById('forward-btn');
    const skipAnimationBtn = document.getElementById('skip-animation-btn');
    const presetSelect = document.getElementById('preset-select');
    const pseudoCodeLines = document.querySelectorAll('#code code span');
    const interfaceDescriptionBtn = document.getElementById('interface-description-btn');
    const mainMenuBtn = document.getElementById('main-menu-btn');

    backBtn.addEventListener('click', () => {
        window.location.reload();
    });

    interfaceDescriptionBtn.addEventListener('click', () => {
        window.location.href = 'interface-description.html';
    });

    mainMenuBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    addNodeBtn.addEventListener('click', () => {
        const nodeName = `V${nodeCount++}`;
        nodes.push({ id: nodeName, x: width / 2, y: height / 2 });
        updateGraph();
    });

    addEdgeBtn.addEventListener('click', () => {
        const fromNode = prompt('Введіть назву початкової вершини:');
        const toNode = prompt('Введіть назву кінцевої вершини:');
        const capacity = parseInt(prompt('Введіть пропускну здатність ребра:'), 10);
        if (fromNode && toNode && !isNaN(capacity)) {
            edges.push({ source: fromNode, target: toNode, capacity, flow: 0 });
            updateGraph();
        }
    });

    presetSelect.addEventListener('change', () => {
        const selectedValue = presetSelect.value;
        if (selectedValue === 'preset1') {
            loadPresetGraph1();
        } else if (selectedValue === 'preset2') {
            loadPresetGraph2();
        } else if (selectedValue === 'preset3') {
            loadPresetGraph3();
        } else if (selectedValue === 'preset4') {
            loadPresetGraph4();
        }
    });

    runAlgorithmBtn.addEventListener('click', () => {
        highlightCodeLine(0); // Highlight "s ← pick(v)"
        svg.on('click', selectSourceNode);
        alert('Оберіть вершину-джерело і вершину-сток, натиснувши на них');
    });

    function selectSourceNode(event) {
        const [x, y] = d3.pointer(event);
        const selectedNode = getNodeAtPosition(x, y);
        if (selectedNode) {
            sourceNode = selectedNode;
            updateGraph();
            highlightCodeLine(1); // Highlight "t ← pick(v)"
            svg.on('click', selectSinkNode);
        }
    }

    function selectSinkNode(event) {
        const [x, y] = d3.pointer(event);
        const selectedNode = getNodeAtPosition(x, y);
        if (selectedNode) {
            sinkNode = selectedNode;
            updateGraph();
            highlightCodeLine(2); // Highlight "BEGIN"
            svg.on('click', null);
            alert('Для подальшої роботи алгоритму, будь ласка, користуйтесь кнопкою "Крок вперед" або оберіть пропустити анімацію');
            currentStep++;
        }
    }

    backBtn.addEventListener('click', () => {
        if (currentStep > 0) {
            currentStep--;
            executeStep(currentStep);
        }
    });

    forwardBtn.addEventListener('click', () => {
        executeNextStep();
    });

    skipAnimationBtn.addEventListener('click', () => {
        skipToMaxFlow();
    });

    function updateGraph() {
        svg.selectAll('*').remove();
    
        // Arrowhead marker with constant size
        svg.append('defs').append('marker')
            .attr('id', 'arrowhead-fixed')
            .attr('viewBox', '-0 -5 10 10')
            .attr('refX', 13)
            .attr('refY', 0)
            .attr('orient', 'auto')
            .attr('markerWidth', 10)
            .attr('markerHeight', 10)
            .attr('xoverflow', 'visible')
            .append('svg:path')
            .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
            .attr('fill', '#000')
            .style('stroke', 'none');
    
        const minCapacity = d3.min(edges, d => d.capacity);
        const maxCapacity = d3.max(edges, d => d.capacity);
        const edgeWidthScale = d3.scaleLinear()
            .domain([minCapacity, maxCapacity])
            .range([4, 20]); // Adjusted for highlight thickness
    
        const link = svg.selectAll(".link")
            .data(edges)
            .enter().append("g")
            .attr("class", "link");
    
        link.append("line")
            .style("stroke-width", d => edgeWidthScale(d.capacity))
            .style("stroke", d => path.find(p => p.source === d.source && p.target === d.target) ? "red" : "rgba(135, 206, 250, 0.5)") // Semi-transparent blue highlight or red for path
            .attr("x1", d => getNodeById(d.source).x)
            .attr("y1", d => getNodeById(d.source).y)
            .attr("x2", d => getNodeById(d.target).x)
            .attr("y2", d => getNodeById(d.target).y);
    
        link.append("line")
            .attr('marker-end', 'url(#arrowhead-fixed)') // Use fixed marker for arrowheads
            .style("stroke-width", 2)
            .style("stroke", "black")
            .attr("x1", d => getNodeById(d.source).x)
            .attr("y1", d => getNodeById(d.source).y)
            .attr("x2", d => getNodeById(d.target).x)
            .attr("y2", d => getNodeById(d.target).y);
    
        link.append("text")
            .attr("class", "link-label")
            .attr("dy", -5)
            .attr("text-anchor", "middle")
            .attr("x", d => (getNodeById(d.source).x + getNodeById(d.target).x) / 2)
            .attr("y", d => (getNodeById(d.source).y + getNodeById(d.target).y) / 2)
            .text(d => {
                if (isInitialized) {
                    if (isPathFound && path.find(p => p.source === d.source && p.target === d.target)) {
                        return `${pathFlow}/${d.capacity}`;
                    }
                    return `${d.flow}/${d.capacity}`;
                } else {
                    return `${d.capacity}`;
                }
            });
    
        const node = svg.selectAll(".node")
            .data(nodes)
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${d.x},${d.y})`)
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));
    
        node.append("circle")
            .attr("r", 20)
            .style("fill", d => d === sourceNode ? 'green' : d === sinkNode ? 'red' : 'blue');
    
        node.append("text")
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .style("fill", "white")
            .text(d => d.id);
    }    
    
    function dragstarted(event, d) {
        d3.select(this).raise().classed("active", true);
    }

    function dragged(event, d) {
        d.x = Math.max(20, Math.min(width - 20, event.x));
        d.y = Math.max(20, Math.min(height - 20, event.y));
        d3.select(this).attr("transform", `translate(${d.x},${d.y})`);
        updateGraph();
    }

    function dragended(event, d) {
        d3.select(this).classed("active", false);
    }

    function highlightCodeLine(lineNumber) {
        pseudoCodeLines.forEach((line, index) => {
            if (index === lineNumber) {
                line.classList.add('highlight');
            } else {
                line.classList.remove('highlight');
            }
        });
    }

    function highlightMultipleLines(lineNumbers) {
        pseudoCodeLines.forEach((line, index) => {
            if (lineNumbers.includes(index)) {
                line.classList.add('highlight');
            } else {
                line.classList.remove('highlight');
            }
        });
    }

    function initializeFlow() {
        graph = createResidualGraph();
        highlightMultipleLines([3, 4, 5]); // Highlight "(* Initializing the flow *)", "FOR { e ∈ E } DO", and "f(e) ← 0"
        edges.forEach(edge => {
            edge.flow = 0;
        });
        isInitialized = true; // Set initialized state to true
        updateGraph();
        algorithmSteps.push({ type: 'initializeFlow' });
        currentStep++;
    }

    function executeNextStep() {
        switch (currentStep) {
            case 0:
                highlightCodeLine(2); // Highlight "BEGIN"
                currentStep++;
                break;
            case 1:
                highlightMultipleLines([3, 4, 5]); // Highlight "(* Initializing the flow *)", "FOR { e ∈ E } DO", and "f(e) ← 0"
                edges.forEach(edge => {
                    edge.flow = 0;
                });
                isInitialized = true; // Set initialized state to true
                updateGraph(); // Update graph to reflect "0/capacity" labels
                currentStep++;
                break;
            case 2:
                initializeFlow();
                break;
            case 3:
                highlightMultipleLines([6, 7]); // Highlight "(* Main Loop *)", "WHILE path might exist DO"
                findAndHighlightPath(); // Highlight the path edges
                algorithmSteps.push({ type: 'mainLoop' });
                currentStep++;
                break;
            case 4:
                highlightMultipleLines([8, 9]); // Highlight "path ← FIND_PATH(s,t)", "augmentation ← min(e ∈ path)"
                pathFlow = getPathFlow();
                allPathFlows.push(pathFlow); // Store each path flow
                isPathFound = true;
                updateGraph(); // Update graph to show path capacities
                currentStep++;
                break;
            case 5:
                highlightMultipleLines([10, 11]); // Highlight "FOR {e ∈ path}" and "flow(e) ← flow(e) + augmentation"
                updateGraph(); // Ensure graph is updated after highlighting
                currentStep++;
                break;
            case 6:
                updateGraph(); // Update the graph before the next step
                if (bfs(graph, sourceNode.id, sinkNode.id, parent)) {
                    findPathAndUpdateFlow();
                } else {
                    highlightCodeLine(12);
                    alert(`Максимальний потік: ${maxFlow}`);
                }
                break;
            case 7:
                if (algorithmSteps.length > 0 && algorithmSteps[algorithmSteps.length - 1].type !== 'noMorePaths') {
                    findPathAndUpdateFlow();
                } else {
                    highlightCodeLine(12);
                    alert(`Максимальний потік: ${maxFlow}`);
                }
                break;
            default:
                break;
        }
    }

    function findAndHighlightPath() {
        if (bfs(graph, sourceNode.id, sinkNode.id, parent)) {
            path = [];
            for (let v = sinkNode.id; v !== sourceNode.id; v = parent[v]) {
                let u = parent[v];
                path.push({ source: u, target: v });
            }
            console.log("Found path: ", path); // Log the found path for debugging
            path.forEach(edge => {
                const graphEdge = edges.find(e => e.source === edge.source && e.target === edge.target);
                if (graphEdge) {
                    graphEdge.color = "red"; // Highlight path edges in red
                }
            });
            algorithmSteps.push({ type: 'highlightPath', path });
            updateGraph(); // Ensure the graph updates with highlighted edges
            alert(`Знайдений шлях: ${path.map(e => e.source).concat(sinkNode.id).join(' → ')}`);
        }
    }

    function getPathFlow() {
        let pathFlow = Infinity;
        for (let v = sinkNode.id; v !== sourceNode.id; v = parent[v]) {
            let u = parent[v];
            pathFlow = Math.min(pathFlow, graph[u][v].capacity - graph[u][v].flow);
        }
        return pathFlow;
    }

    function findPathAndUpdateFlow() {
        highlightCodeLine(8); // Highlight "augmentation ← min(e ∈ path)"
        let pathFlow = getPathFlow();

        for (let v = sinkNode.id; v !== sourceNode.id; v = parent[v]) {
            let u = parent[v];
            graph[u][v].flow += pathFlow;
            graph[v][u].flow -= pathFlow;
        }

        maxFlow += pathFlow;
        algorithmSteps.push(JSON.parse(JSON.stringify({ type: 'updateFlow', graph: graph, pathFlow: pathFlow, maxFlow: maxFlow })));
        edges.forEach(edge => {
            if (graph[edge.source][edge.target].flow > 0) {
                edge.flow = graph[edge.source][edge.target].flow; // Оновлення реального потоку ребра
                edge.color = "red";
            }
        });
        updateGraph();

        if (bfs(graph, sourceNode.id, sinkNode.id, parent)) {
            currentStep = 3; // Continue from the main loop
        } else {
            highlightCodeLine(12); // Highlight "END"
            maxFlow = Math.max(...allPathFlows); // Find the maximum path flow
            alert(`Максимальний потік: ${maxFlow}`);
        }
    }

    function createResidualGraph() {
        let graph = {};
        nodes.forEach(node => {
            graph[node.id] = {};
        });
        edges.forEach(edge => {
            graph[edge.source][edge.target] = { capacity: edge.capacity, flow: 0 };
            if (!graph[edge.target][edge.source]) {
                graph[edge.target][edge.source] = { capacity: 0, flow: 0 };
            }
        });
        return graph;
    }

    function bfs(graph, source, sink, parent) {
        let visited = {};
        nodes.forEach(node => {
            visited[node.id] = false;
        });
        let queue = [source];
        visited[source] = true;
        parent[source] = -1;

        while (queue.length) {
            let u = queue.shift();
            for (let v in graph[u]) {
                if (!visited[v] && graph[u][v].capacity > graph[u][v].flow) {
                    queue.push(v);
                    visited[v] = true;
                    parent[v] = u;
                    if (v === sink) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    function executeStep(step) {
        if (step >= 0 && step < algorithmSteps.length) {
            const stepData = algorithmSteps[step];
            if (stepData.type === 'initializeFlow') {
                edges.forEach(edge => {
                    edge.flow = 0;
                });
                isInitialized = true; // Set initialized state to true
                updateGraph();
                highlightMultipleLines([3, 4, 5]);
            } else if (stepData.type === 'updateFlow') {
                stepData.graph.edges.forEach(edge => {
                    const edgeInCurrentGraph = edges.find(e => e.source === edge.source && e.target === edge.target);
                    edgeInCurrentGraph.flow = edge.flow;
                });
                updateGraph();
                highlightCodeLine(6);
            } else if (stepData.type === 'noMorePaths') {
                maxFlow = Math.max(...allPathFlows); // Find the maximum path flow
                alert(`Максимальний потік: ${maxFlow}`);
                highlightCodeLine(7);
            }
        }
    }

    function getNodeAtPosition(x, y) {
        return nodes.find(node => {
            const dx = node.x - x;
            const dy = node.y - y;
            return Math.sqrt(dx * dx + dy * dy) < 20;
        });
    }

    function getNodeById(id) {
        return nodes.find(node => node.id === id);
    }

    function loadPresetGraph1() {
        nodes = [
            { id: 'S', x: 100, y: 100 },
            { id: 'A', x: 200, y: 200 },
            { id: 'B', x: 300, y: 100 },
            { id: 'T', x: 400, y: 200 }
        ];
        edges = [
            { source: 'S', target: 'A', capacity: 10, flow: 0 },
            { source: 'S', target: 'B', capacity: 5, flow: 0 },
            { source: 'A', target: 'B', capacity: 15, flow: 0 },
            { source: 'A', target: 'T', capacity: 10, flow: 0 },
            { source: 'B', target: 'T', capacity: 10, flow: 0 }
        ];
        updateGraph();
    }

    function loadPresetGraph2() {
        nodes = [
            { id: 'S', x: 100, y: 100 },
            { id: 'A', x: 200, y: 50 },
            { id: 'B', x: 200, y: 150 },
            { id: 'T', x: 300, y: 100 }
        ];
        edges = [
            { source: 'S', target: 'A', capacity: 8, flow: 0 },
            { source: 'S', target: 'B', capacity: 5, flow: 0 },
            { source: 'A', target: 'B', capacity: 3, flow: 0 },
            { source: 'A', target: 'T', capacity: 7, flow: 0 },
            { source: 'B', target: 'T', capacity: 10, flow: 0 }
        ];
        updateGraph();
    }

    function loadPresetGraph3() {
        nodes = [
            { id: 'S', x: 100, y: 100 },
            { id: 'A', x: 200, y: 200 },
            { id: 'B', x: 300, y: 50 },
            { id: 'C', x: 300, y: 150 },
            { id: 'T', x: 400, y: 100 }
        ];
        edges = [
            { source: 'S', target: 'A', capacity: 10, flow: 0 },
            { source: 'S', target: 'B', capacity: 5, flow: 0 },
            { source: 'A', target: 'C', capacity: 15, flow: 0 },
            { source: 'B', target: 'C', capacity: 10, flow: 0 },
            { source: 'C', target: 'T', capacity: 10, flow: 0 }
        ];
        updateGraph();
    }

    function loadPresetGraph4() {
        nodes = [
            { id: 'S', x: 100, y: 100 },
            { id: 'A', x: 200, y: 100 },
            { id: 'B', x: 200, y: 200 },
            { id: 'C', x: 300, y: 200 },
            { id: 'D', x: 300, y: 100 },
            { id: 'T', x: 400, y: 100 }
        ];
        edges = [
            { source: 'S', target: 'A', capacity: 8, flow: 0 },
            { source: 'S', target: 'B', capacity: 5, flow: 0 },
            { source: 'A', target: 'C', capacity: 7, flow: 0 },
            { source: 'B', target: 'D', capacity: 7, flow: 0 },
            { source: 'C', target: 'T', capacity: 8, flow: 0 },
            { source: 'D', target: 'T', capacity: 5, flow: 0 }
        ];
        updateGraph();
    }

    function skipToMaxFlow() {
        initializeFlow();
        while (bfs(graph, sourceNode.id, sinkNode.id, parent)) {
            pathFlow = getPathFlow();
            allPathFlows.push(pathFlow); // Store each path flow
            for (let v = sinkNode.id; v !== sourceNode.id; v = parent[v]) {
                let u = parent[v];
                graph[u][v].flow += pathFlow;
                graph[v][u].flow -= pathFlow;
            }
            maxFlow += pathFlow;
        }
        highlightCodeLine(12); // Highlight "END"
        maxFlow = Math.max(...allPathFlows); // Find the maximum path flow
        alert(`Максимальний потік: ${maxFlow}`);
        updateGraph();
    }
});
