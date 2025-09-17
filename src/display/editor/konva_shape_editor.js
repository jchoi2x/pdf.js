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

import { AnnotationEditorParamsType, AnnotationEditorType } from "../../shared/util.js";
import { DrawingEditor } from "./draw.js";
import { KonvaShapeDrawer } from "./drawers/konva_shape_drawer.js";

/**
 * Konva-based shape drawing editor.
 * Extends DrawingEditor to provide geometric shape drawing capabilities.
 */
class KonvaShapeEditor extends DrawingEditor {
  #shapeDrawer = null;

  #currentShapeType = 'rect';

  #isDrawing = false;

  #konvaDrawLayer = null;

  #currentShapeId = null;

  static _type = "konvaShape";

  static _editorType = AnnotationEditorType.KONVA_SHAPE;

  constructor(params) {
    super({ ...params, mustBeCommitted: false });
    
    this.#shapeDrawer = new KonvaShapeDrawer(this.#currentShapeType);
    this.#konvaDrawLayer = params.konvaDrawLayer;
    this.fillColor = 'transparent';
    this.fillEnabled = false;
    
    this._setupShapeEditor();
  }

  /**
   * Setup shape editor specific functionality
   */
  _setupShapeEditor() {
    // Set initial properties
    this.#shapeDrawer.setProperties({
      stroke: this.color || '#000000',
      strokeWidth: this.thickness || 2,
      fill: 'transparent'
    });
  }

  /**
   * Set the current shape type
   * @param {string} shapeType - Type of shape to draw
   */
  setShapeType(shapeType) {
    if (KonvaShapeDrawer.getSupportedShapeTypes().includes(shapeType)) {
      this.#currentShapeType = shapeType;
      this.#shapeDrawer.shapeType = shapeType;
    }
  }

  /**
   * Get the current shape type
   * @returns {string} Current shape type
   */
  get shapeType() {
    return this.#currentShapeType;
  }

  /**
   * Handle pointer down event
   * @param {PointerEvent} event - Pointer event
   */
  onPointerDown(event) {
    if (this.#isDrawing || !this.#konvaDrawLayer) {
      return;
    }

    const { offsetX, offsetY } = this._getEventCoordinates(event);
    
    this.#isDrawing = true;
    this.#shapeDrawer.startShape(offsetX, offsetY, {
      stroke: this.color || '#000000',
      strokeWidth: this.thickness || 2,
      fill: 'transparent'
    });

    // Create initial shape in Konva layer
    const initialConfig = this.#shapeDrawer.currentShape;
    this.#currentShapeId = this.#konvaDrawLayer.drawShape(
      initialConfig, 
      this.#currentShapeType
    );

    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Handle pointer move event
   * @param {PointerEvent} event - Pointer event
   */
  onPointerMove(event) {
    if (!this.#isDrawing || !this.#konvaDrawLayer || !this.#currentShapeId) {
      return;
    }

    const { offsetX, offsetY } = this._getEventCoordinates(event);
    
    // Update shape configuration
    const updatedConfig = this.#shapeDrawer.updateShape(offsetX, offsetY);
    
    // Update shape in Konva layer
    this.#konvaDrawLayer.updateShape(this.#currentShapeId, updatedConfig);

    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Handle pointer up event
   * @param {PointerEvent} event - Pointer event
   */
  onPointerUp(event) {
    if (!this.#isDrawing || !this.#konvaDrawLayer || !this.#currentShapeId) {
      return;
    }

    const { offsetX, offsetY } = this._getEventCoordinates(event);
    
    // Finalize shape
    const finalConfig = this.#shapeDrawer.finishShape(offsetX, offsetY);
    this.#konvaDrawLayer.updateShape(this.#currentShapeId, finalConfig);

    // Select the new shape
    this.#konvaDrawLayer.selectShape(this.#currentShapeId);

    this.#isDrawing = false;
    this.#currentShapeId = null;

    // Commit the change
    this.commit();

    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Get event coordinates relative to the editor
   * @param {Event} event - DOM event
   * @returns {Object} Coordinates {offsetX, offsetY}
   */
  _getEventCoordinates(event) {
    const rect = this.div.getBoundingClientRect();
    return {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top
    };
  }

  /**
   * Update editor properties
   * @param {string} name - Property name
   * @param {*} value - Property value
   */
  updateProperty(name, value) {
    switch (name) {
      case AnnotationEditorParamsType.KONVA_SHAPE_COLOR:
        this.color = value;
        this.#shapeDrawer.setProperties({ stroke: value });
        break;
      case AnnotationEditorParamsType.KONVA_SHAPE_THICKNESS:
        this.thickness = value;
        this.#shapeDrawer.setProperties({ strokeWidth: value });
        break;
      case AnnotationEditorParamsType.KONVA_SHAPE_TYPE:
        this.setShapeType(value);
        break;
      case AnnotationEditorParamsType.KONVA_SHAPE_FILL:
        this.fillColor = value;
        this.#shapeDrawer.setProperties({ fill: this.fillEnabled ? value : 'transparent' });
        break;
      case AnnotationEditorParamsType.KONVA_SHAPE_FILL_ENABLED:
        this.fillEnabled = value;
        this.#shapeDrawer.setProperties({ 
          fill: value ? (this.fillColor || 'transparent') : 'transparent' 
        });
        break;
    }
  }

  /**
   * Render the editor
   * @returns {HTMLElement} Editor element
   */
  render() {
    const div = super.render();
    
    if (!div) {
      return null;
    }

    // Add shape-specific styling
    div.classList.add("konvaShapeEditor");
    
    // Add event listeners for drawing
    div.addEventListener("pointerdown", this.onPointerDown.bind(this));
    div.addEventListener("pointermove", this.onPointerMove.bind(this));
    div.addEventListener("pointerup", this.onPointerUp.bind(this));
    
    return div;
  }

  /**
   * Serialize the editor data
   * @param {boolean} isForCopying - Whether this is for copying
   * @returns {Object} Serialized data
   */
  serialize(isForCopying = false) {
    const data = super.serialize(isForCopying);
    
    return {
      ...data,
      shapeType: this.#currentShapeType,
      shapesData: this.#konvaDrawLayer?.getShapesData() || []
    };
  }

  /**
   * Deserialize editor data
   * @param {Object} data - Serialized data
   * @param {Object} parent - Parent element
   * @param {Object} uiManager - UI manager
   * @returns {KonvaShapeEditor} New editor instance
   */
  static deserialize(data, parent, uiManager) {
    const editor = new KonvaShapeEditor({
      parent,
      uiManager,
      konvaDrawLayer: parent.konvaDrawLayer
    });

    if (data.shapeType) {
      editor.setShapeType(data.shapeType);
    }

    if (data.shapesData && editor.#konvaDrawLayer) {
      editor.#konvaDrawLayer.loadShapesData(data.shapesData);
    }

    return editor;
  }

  /**
   * Check if editor is empty
   * @returns {boolean} True if empty
   */
  isEmpty() {
    return !this.#konvaDrawLayer || this.#konvaDrawLayer.getShapesData().length === 0;
  }

  /**
   * Remove the editor
   */
  remove() {
    if (this.#konvaDrawLayer) {
      this.#konvaDrawLayer.clear();
    }
    super.remove();
  }

  /**
   * Get supported shape types for UI
   * @returns {Array<Object>} Array of shape type objects
   */
  static getSupportedShapeTypes() {
    return [
      { value: 'rect', label: 'Rectangle' },
      { value: 'circle', label: 'Circle' },
      { value: 'ellipse', label: 'Ellipse' },
      { value: 'line', label: 'Line' },
      { value: 'arrow', label: 'Arrow' }
    ];
  }
}

export { KonvaShapeEditor };