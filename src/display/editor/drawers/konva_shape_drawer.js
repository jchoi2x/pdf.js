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

import { Outline } from "./outline.js";

/**
 * Shape drawer for geometric shapes using Konva.js
 * Provides drawing functionality for rectangles, circles, lines, etc.
 */
class KonvaShapeDrawer extends Outline {
  #shapeType;
  #properties;
  #startPoint;
  #currentShape;

  constructor(shapeType = 'rect') {
    super();
    this.#shapeType = shapeType;
    this.#properties = {
      stroke: '#000000',
      strokeWidth: 2,
      fill: 'transparent'
    };
  }

  /**
   * Start drawing a new shape
   * @param {number} x - Starting x coordinate
   * @param {number} y - Starting y coordinate
   * @param {Object} properties - Shape properties
   */
  startShape(x, y, properties = {}) {
    this.#startPoint = { x, y };
    this.#properties = { ...this.#properties, ...properties };
    
    // Create initial shape configuration
    this.#currentShape = this.#createShapeConfig(x, y, x, y);
    
    return this.#currentShape;
  }

  /**
   * Update shape while drawing
   * @param {number} x - Current x coordinate
   * @param {number} y - Current y coordinate
   */
  updateShape(x, y) {
    if (!this.#startPoint) {
      return null;
    }

    this.#currentShape = this.#createShapeConfig(
      this.#startPoint.x, 
      this.#startPoint.y, 
      x, 
      y
    );
    
    return this.#currentShape;
  }

  /**
   * Finish drawing the shape
   * @param {number} x - Final x coordinate
   * @param {number} y - Final y coordinate
   */
  finishShape(x, y) {
    const finalShape = this.updateShape(x, y);
    this.#startPoint = null;
    this.#currentShape = null;
    
    return finalShape;
  }

  /**
   * Create shape configuration based on shape type
   * @param {number} startX - Start x coordinate
   * @param {number} startY - Start y coordinate
   * @param {number} endX - End x coordinate
   * @param {number} endY - End y coordinate
   * @returns {Object} Shape configuration
   */
  #createShapeConfig(startX, startY, endX, endY) {
    const baseConfig = { ...this.#properties };

    switch (this.#shapeType) {
      case 'rect':
        return {
          ...baseConfig,
          x: Math.min(startX, endX),
          y: Math.min(startY, endY),
          width: Math.abs(endX - startX),
          height: Math.abs(endY - startY)
        };

      case 'circle':
        const radius = Math.sqrt(
          Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
        );
        return {
          ...baseConfig,
          x: startX,
          y: startY,
          radius
        };

      case 'ellipse':
        return {
          ...baseConfig,
          x: (startX + endX) / 2,
          y: (startY + endY) / 2,
          radiusX: Math.abs(endX - startX) / 2,
          radiusY: Math.abs(endY - startY) / 2
        };

      case 'line':
        return {
          ...baseConfig,
          points: [startX, startY, endX, endY]
        };

      case 'arrow':
        return {
          ...baseConfig,
          points: [startX, startY, endX, endY],
          pointerLength: 10,
          pointerWidth: 8,
          pointerAtBeginning: false,
          pointerAtEnding: true
        };

      default:
        console.warn(`Unknown shape type: ${this.#shapeType}`);
        return baseConfig;
    }
  }

  /**
   * Set shape properties
   * @param {Object} properties - Properties to set
   */
  setProperties(properties) {
    this.#properties = { ...this.#properties, ...properties };
  }

  /**
   * Get current shape type
   * @returns {string} Shape type
   */
  get shapeType() {
    return this.#shapeType;
  }

  /**
   * Set shape type
   * @param {string} type - New shape type
   */
  set shapeType(type) {
    this.#shapeType = type;
  }

  /**
   * Check if shape is being drawn
   * @returns {boolean} True if drawing in progress
   */
  get isDrawing() {
    return this.#startPoint !== null;
  }

  /**
   * Get current shape configuration
   * @returns {Object|null} Current shape config
   */
  get currentShape() {
    return this.#currentShape;
  }

  // Required Outline class implementations
  toSVGPath() {
    // Convert current shape to SVG path if needed
    if (!this.#currentShape) {
      return '';
    }

    switch (this.#shapeType) {
      case 'rect':
        const { x, y, width, height } = this.#currentShape;
        return `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z`;
      
      case 'circle':
        const { x: cx, y: cy, radius } = this.#currentShape;
        return `M ${cx - radius} ${cy} A ${radius} ${radius} 0 1 1 ${cx + radius} ${cy} A ${radius} ${radius} 0 1 1 ${cx - radius} ${cy}`;
      
      case 'line':
        const [x1, y1, x2, y2] = this.#currentShape.points;
        return `M ${x1} ${y1} L ${x2} ${y2}`;
      
      default:
        return '';
    }
  }

  get box() {
    if (!this.#currentShape) {
      return null;
    }

    switch (this.#shapeType) {
      case 'rect':
        const { x, y, width, height } = this.#currentShape;
        return [x, y, width, height];
      
      case 'circle':
        const { x: cx, y: cy, radius } = this.#currentShape;
        return [cx - radius, cy - radius, radius * 2, radius * 2];
      
      case 'ellipse':
        const { x: ex, y: ey, radiusX, radiusY } = this.#currentShape;
        return [ex - radiusX, ey - radiusY, radiusX * 2, radiusY * 2];
      
      case 'line':
        const [x1, y1, x2, y2] = this.#currentShape.points;
        return [
          Math.min(x1, x2),
          Math.min(y1, y2),
          Math.abs(x2 - x1),
          Math.abs(y2 - y1)
        ];
      
      default:
        return [0, 0, 0, 0];
    }
  }

  serialize(bbox, rotation) {
    return {
      type: this.#shapeType,
      properties: this.#properties,
      shape: this.#currentShape,
      bbox,
      rotation
    };
  }

  /**
   * Create a shape drawer from serialized data
   * @param {Object} data - Serialized data
   * @returns {KonvaShapeDrawer} New shape drawer
   */
  static deserialize(data) {
    const drawer = new KonvaShapeDrawer(data.type);
    drawer.setProperties(data.properties);
    drawer.#currentShape = data.shape;
    return drawer;
  }

  /**
   * Get available shape types
   * @returns {Array<string>} Array of supported shape types
   */
  static getSupportedShapeTypes() {
    return ['rect', 'circle', 'ellipse', 'line', 'arrow'];
  }
}

export { KonvaShapeDrawer };