/* Copyright 2024 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Konva from "konva";

/**
 * Manage canvas-based drawing using Konva.js on top of the page canvas.
 * This provides an alternative to SVG-based drawing with better performance
 * for complex shapes and built-in interactivity.
 */
class KonvaDrawLayer {
  #parent = null;

  #stage = null;

  #layer = null;

  #shapes = new Map();

  #transformer = null;

  static #id = 0;

  constructor({ pageIndex }) {
    this.pageIndex = pageIndex;
  }

  setParent(parent) {
    if (!this.#parent) {
      this.#parent = parent;
      this.#initializeKonva();
      return;
    }

    if (this.#parent !== parent) {
      // Move the stage to new parent
      if (this.#stage) {
        this.#stage.container().remove();
        parent.append(this.#stage.container());
      }
      this.#parent = parent;
    }
  }

  #initializeKonva() {
    if (!this.#parent) {
      return;
    }

    // Create container div for Konva
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.top = "0";
    container.style.left = "0";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.pointerEvents = "auto";
    container.className = "konva-draw-layer";
    
    this.#parent.append(container);

    // Initialize Konva stage
    this.#stage = new Konva.Stage({
      container,
      width: this.#parent.clientWidth,
      height: this.#parent.clientHeight,
    });

    // Create main drawing layer
    this.#layer = new Konva.Layer();
    this.#stage.add(this.#layer);

    // Create transformer for shape manipulation
    this.#transformer = new Konva.Transformer({
      enabledAnchors: [
        'top-left', 'top-right', 'bottom-left', 'bottom-right',
        'top-center', 'bottom-center', 'middle-left', 'middle-right'
      ],
      rotateEnabled: true,
      borderStroke: '#4A90E2',
      borderStrokeWidth: 1,
      anchorStroke: '#4A90E2',
      anchorFill: '#ffffff',
      anchorSize: 8,
    });
    this.#layer.add(this.#transformer);

    // Handle window resize
    this.#setupResizeHandler();
  }

  #setupResizeHandler() {
    const resizeObserver = new ResizeObserver(() => {
      if (this.#stage && this.#parent) {
        this.#stage.width(this.#parent.clientWidth);
        this.#stage.height(this.#parent.clientHeight);
        this.#stage.batchDraw();
      }
    });
    
    resizeObserver.observe(this.#parent);
  }

  /**
   * Draw a shape on the canvas
   * @param {Object} shapeConfig - Konva shape configuration
   * @param {string} shapeType - Type of shape (rect, circle, line, etc.)
   * @returns {number} Shape ID
   */
  drawShape(shapeConfig, shapeType = 'rect') {
    if (!this.#layer) {
      console.warn("KonvaDrawLayer not initialized");
      return null;
    }

    const id = KonvaDrawLayer.#id++;
    let shape;

    // Create shape based on type
    switch (shapeType) {
      case 'rect':
        shape = new Konva.Rect({
          x: shapeConfig.x || 0,
          y: shapeConfig.y || 0,
          width: shapeConfig.width || 100,
          height: shapeConfig.height || 50,
          fill: shapeConfig.fill || 'transparent',
          stroke: shapeConfig.stroke || '#000000',
          strokeWidth: shapeConfig.strokeWidth || 2,
          draggable: true,
          ...shapeConfig
        });
        break;
      case 'circle':
        shape = new Konva.Circle({
          x: shapeConfig.x || 50,
          y: shapeConfig.y || 50,
          radius: shapeConfig.radius || 25,
          fill: shapeConfig.fill || 'transparent',
          stroke: shapeConfig.stroke || '#000000',
          strokeWidth: shapeConfig.strokeWidth || 2,
          draggable: true,
          ...shapeConfig
        });
        break;
      case 'line':
        shape = new Konva.Line({
          points: shapeConfig.points || [0, 0, 100, 100],
          stroke: shapeConfig.stroke || '#000000',
          strokeWidth: shapeConfig.strokeWidth || 2,
          draggable: true,
          ...shapeConfig
        });
        break;
      case 'ellipse':
        shape = new Konva.Ellipse({
          x: shapeConfig.x || 50,
          y: shapeConfig.y || 50,
          radiusX: shapeConfig.radiusX || 50,
          radiusY: shapeConfig.radiusY || 25,
          fill: shapeConfig.fill || 'transparent',
          stroke: shapeConfig.stroke || '#000000',
          strokeWidth: shapeConfig.strokeWidth || 2,
          draggable: true,
          ...shapeConfig
        });
        break;
      default:
        console.warn(`Unknown shape type: ${shapeType}`);
        return null;
    }

    // Add shape ID
    shape.id(`shape_${id}`);

    // Add click handler for selection
    shape.on('click tap', () => {
      this.selectShape(id);
    });

    // Add to layer and map
    this.#layer.add(shape);
    this.#shapes.set(id, { shape, type: shapeType });
    this.#layer.batchDraw();

    return id;
  }

  /**
   * Select a shape for editing
   * @param {number} shapeId - ID of the shape to select
   */
  selectShape(shapeId) {
    const shapeData = this.#shapes.get(shapeId);
    if (!shapeData) {
      return;
    }

    this.#transformer.nodes([shapeData.shape]);
    this.#layer.batchDraw();
  }

  /**
   * Deselect all shapes
   */
  deselectAll() {
    this.#transformer.nodes([]);
    this.#layer.batchDraw();
  }

  /**
   * Remove a shape
   * @param {number} shapeId - ID of the shape to remove
   */
  removeShape(shapeId) {
    const shapeData = this.#shapes.get(shapeId);
    if (shapeData) {
      shapeData.shape.destroy();
      this.#shapes.delete(shapeId);
      this.#layer.batchDraw();
    }
  }

  /**
   * Update shape properties
   * @param {number} shapeId - ID of the shape to update
   * @param {Object} properties - New properties
   */
  updateShape(shapeId, properties) {
    const shapeData = this.#shapes.get(shapeId);
    if (shapeData) {
      shapeData.shape.setAttrs(properties);
      this.#layer.batchDraw();
    }
  }

  /**
   * Get all shapes data for serialization
   * @returns {Array} Array of shape data
   */
  getShapesData() {
    const shapesData = [];
    this.#shapes.forEach((shapeData, id) => {
      const attrs = shapeData.shape.getAttrs();
      shapesData.push({
        id,
        type: shapeData.type,
        attrs
      });
    });
    return shapesData;
  }

  /**
   * Load shapes from serialized data
   * @param {Array} shapesData - Array of shape data
   */
  loadShapesData(shapesData) {
    this.clear();
    shapesData.forEach(data => {
      this.drawShape(data.attrs, data.type);
    });
  }

  /**
   * Clear all shapes
   */
  clear() {
    this.#shapes.forEach((shapeData) => {
      shapeData.shape.destroy();
    });
    this.#shapes.clear();
    this.#transformer.nodes([]);
    this.#layer.batchDraw();
  }

  /**
   * Export as image
   * @param {string} format - Image format ('png', 'jpeg')
   * @returns {string} Data URL
   */
  exportAsImage(format = 'png') {
    if (!this.#stage) {
      return null;
    }
    return this.#stage.toDataURL({ 
      pixelRatio: 2,
      mimeType: `image/${format}`,
      quality: 0.9
    });
  }

  /**
   * Destroy the layer and clean up resources
   */
  destroy() {
    if (this.#stage) {
      this.#stage.destroy();
      this.#stage = null;
    }
    this.#layer = null;
    this.#transformer = null;
    this.#shapes.clear();
    this.#parent = null;
  }
}

export { KonvaDrawLayer };