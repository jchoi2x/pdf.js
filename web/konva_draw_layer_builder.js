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

import { KonvaDrawLayer } from "pdfjs/display/konva_draw_layer.js";

/**
 * @typedef {Object} KonvaDrawLayerBuilderOptions
 * @property {number} pageIndex
 * @property {boolean} [enableShapeDrawing] - Enable shape drawing functionality
 */

/**
 * @typedef {Object} KonvaDrawLayerBuilderRenderOptions
 * @property {string} [intent] - The default value is "display".
 */

class KonvaDrawLayerBuilder {
  #konvaDrawLayer = null;

  #enableShapeDrawing = false;

  /**
   * @param {KonvaDrawLayerBuilderOptions} options
   */
  constructor(options) {
    this.pageIndex = options.pageIndex;
    this.#enableShapeDrawing = options.enableShapeDrawing || false;
  }

  /**
   * @param {KonvaDrawLayerBuilderRenderOptions} options
   * @returns {Promise<void>}
   */
  async render({ intent = "display" }) {
    if (intent !== "display" || this.#konvaDrawLayer || this._cancelled) {
      return;
    }

    // Only create Konva layer if shape drawing is enabled
    if (this.#enableShapeDrawing) {
      this.#konvaDrawLayer = new KonvaDrawLayer({
        pageIndex: this.pageIndex,
      });
    }
  }

  /**
   * Enable or disable shape drawing
   * @param {boolean} enabled - Whether to enable shape drawing
   */
  setShapeDrawingEnabled(enabled) {
    this.#enableShapeDrawing = enabled;
    
    if (enabled && !this.#konvaDrawLayer) {
      this.#konvaDrawLayer = new KonvaDrawLayer({
        pageIndex: this.pageIndex,
      });
    } else if (!enabled && this.#konvaDrawLayer) {
      this.#konvaDrawLayer.destroy();
      this.#konvaDrawLayer = null;
    }
  }

  /**
   * Check if shape drawing is enabled
   * @returns {boolean} True if enabled
   */
  get isShapeDrawingEnabled() {
    return this.#enableShapeDrawing;
  }

  cancel() {
    this._cancelled = true;

    if (!this.#konvaDrawLayer) {
      return;
    }
    this.#konvaDrawLayer.destroy();
    this.#konvaDrawLayer = null;
  }

  setParent(parent) {
    this.#konvaDrawLayer?.setParent(parent);
  }

  getKonvaDrawLayer() {
    return this.#konvaDrawLayer;
  }

  /**
   * Get draw layer (returns null since this is Konva-based)
   * @returns {null}
   */
  getDrawLayer() {
    return null;
  }

  /**
   * Draw a shape on the Konva layer
   * @param {Object} shapeConfig - Shape configuration
   * @param {string} shapeType - Type of shape
   * @returns {number|null} Shape ID or null if not available
   */
  drawShape(shapeConfig, shapeType) {
    if (!this.#konvaDrawLayer) {
      console.warn("Konva draw layer not initialized");
      return null;
    }
    return this.#konvaDrawLayer.drawShape(shapeConfig, shapeType);
  }

  /**
   * Select a shape
   * @param {number} shapeId - ID of the shape to select
   */
  selectShape(shapeId) {
    this.#konvaDrawLayer?.selectShape(shapeId);
  }

  /**
   * Deselect all shapes
   */
  deselectAll() {
    this.#konvaDrawLayer?.deselectAll();
  }

  /**
   * Remove a shape
   * @param {number} shapeId - ID of the shape to remove
   */
  removeShape(shapeId) {
    this.#konvaDrawLayer?.removeShape(shapeId);
  }

  /**
   * Update shape properties
   * @param {number} shapeId - ID of the shape to update
   * @param {Object} properties - New properties
   */
  updateShape(shapeId, properties) {
    this.#konvaDrawLayer?.updateShape(shapeId, properties);
  }

  /**
   * Export shapes as image
   * @param {string} format - Image format
   * @returns {string|null} Data URL or null
   */
  exportAsImage(format = 'png') {
    return this.#konvaDrawLayer?.exportAsImage(format) || null;
  }

  /**
   * Get all shapes data for serialization
   * @returns {Array} Array of shape data
   */
  getShapesData() {
    return this.#konvaDrawLayer?.getShapesData() || [];
  }

  /**
   * Load shapes from serialized data
   * @param {Array} shapesData - Array of shape data
   */
  loadShapesData(shapesData) {
    this.#konvaDrawLayer?.loadShapesData(shapesData);
  }

  /**
   * Clear all shapes
   */
  clearShapes() {
    this.#konvaDrawLayer?.clear();
  }
}

export { KonvaDrawLayerBuilder };