# Ford–Fulkerson Algorithm Visualization

Educational web application for visualizing the Ford–Fulkerson algorithm for computing the maximum flow in a flow network.
The project focuses on algorithm visualization, step-by-step execution, and interactive graph representation.

---

## Tech Stack

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=000000)
![HTML](https://img.shields.io/badge/HTML-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)

---

## About the Project

This project provides a visual and interactive representation of the Ford–Fulkerson algorithm.
It allows users to observe how augmenting paths are found and how flow values change step by step until the maximum flow is reached.

The application is intended for educational purposes and helps in understanding flow networks and maximum flow algorithms.

---

## Algorithm Overview

The Ford–Fulkerson algorithm computes the maximum possible flow from a source node to a sink node in a flow network.

Core concepts demonstrated in the visualization:
- residual graph construction
- finding augmenting paths
- updating residual capacities
- flow accumulation

The algorithm iterates until no augmenting path can be found in the residual graph.

---

## Functional Overview

Application features:
- interactive graph representation
- visualization of nodes, edges, and capacities
- step-by-step execution of the algorithm
- dynamic updates of residual capacities
- visual highlighting of augmenting paths

The visualization helps users track algorithm progress in a clear and intuitive way.

---

## Application Structure

    Ford-Fulkerson-Algorithm-Visualization/
      index.html          # main HTML file
      style.css           # styles for visualization
      script.js           # algorithm implementation and visualization logic
      README.md

---

## Getting Started

To run the application locally:

    1. clone the repository
    2. open index.html in a browser

No additional dependencies or build steps are required.

---

## Educational Use

This project can be used as:
- a learning aid for algorithm courses
- a visual supplement for graph theory topics
- a demonstration of algorithm visualization techniques in web development

---

## Project Status

The core visualization and algorithm implementation are complete.

Possible future improvements:
- support for larger graphs
- manual graph editing via UI
- animation speed controls
- comparison with other maximum flow algorithms
