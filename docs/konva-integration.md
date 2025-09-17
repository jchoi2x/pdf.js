# Konva.js Integration for PDF.js Shape Drawing

This implementation adds geometric shape drawing capabilities to PDF.js using Konva.js, providing a canvas-based alternative to the existing SVG annotation system.

## 🎯 Overview

The integration allows users to draw and manipulate geometric shapes (rectangles, circles, ellipses, lines, arrows) on PDF pages with rich interactivity including drag, resize, and rotate operations.

## 🚀 Features

### Core Functionality
- **Multiple Shape Types**: Rectangle, Circle, Ellipse, Line, Arrow
- **Interactive Drawing**: Click and drag to create shapes with real-time preview
- **Shape Manipulation**: Built-in transformer for resize, rotate, and move operations
- **Styling Options**: Customizable stroke color, thickness, fill color, and transparency
- **Export Capabilities**: Export as PNG/JPEG images or serialize for persistence

### Integration Benefits
- **Performance**: Canvas-based rendering for better performance with complex shapes
- **Rich Interactions**: Sophisticated mouse/touch interaction handling via Konva.js
- **Extensibility**: Modular design allows easy addition of new shape types
- **Compatibility**: Seamless integration with existing PDF.js annotation system

## 📁 Architecture

```
src/display/
├── konva_draw_layer.js              # Main Konva canvas layer management
├── editor/
│   ├── konva_shape_editor.js        # Shape editor extending DrawingEditor
│   └── drawers/
│       └── konva_shape_drawer.js    # Shape-specific drawing logic
web/
├── konva_draw_layer_builder.js      # Integration builder following PDF.js patterns
├── viewer.html                      # UI controls and toolbar integration
├── viewer.css                       # Styling for shape editor components
└── images/
    └── toolbarButton-editorKonvaShape.svg  # Shape editor icon
```

## 🔧 Implementation

### 1. Core Classes

#### KonvaDrawLayer
Manages the Konva Stage and Layer, providing the main interface for shape operations.

```javascript
const konvaLayer = new KonvaDrawLayer({ pageIndex: 0 });
konvaLayer.setParent(parentElement);

// Draw shapes
const rectId = konvaLayer.drawShape({
    x: 10, y: 10, width: 100, height: 50,
    stroke: '#000000', strokeWidth: 2
}, 'rect');

// Manipulate shapes
konvaLayer.selectShape(rectId);
konvaLayer.updateShape(rectId, { stroke: '#ff0000' });
```

#### KonvaShapeDrawer
Extends the Outline base class to provide shape-specific drawing logic.

```javascript
const drawer = new KonvaShapeDrawer('rect');
drawer.startShape(x, y, properties);
drawer.updateShape(x, y);  // Real-time preview
const finalConfig = drawer.finishShape(x, y);
```

#### KonvaShapeEditor
Extends DrawingEditor to integrate with the PDF.js annotation system.

```javascript
const editor = new KonvaShapeEditor({
    parent: annotationLayer,
    uiManager: editorUIManager,
    konvaDrawLayer: konvaLayer
});
```

### 2. UI Integration

The implementation adds a new toolbar button with shape type selection and styling options:

- **Shape Type Selector**: Dropdown for choosing shape type
- **Color Pickers**: Stroke and fill color selection
- **Thickness Slider**: Adjustable line thickness
- **Fill Options**: Toggle and color for shape fills

### 3. Type Definitions

Added new annotation editor types in `src/shared/util.js`:

```javascript
const AnnotationEditorType = {
    // ... existing types
    KONVA_SHAPE: 103,
};

const AnnotationEditorParamsType = {
    // ... existing params
    KONVA_SHAPE_TYPE: 51,
    KONVA_SHAPE_COLOR: 52,
    KONVA_SHAPE_THICKNESS: 53,
    KONVA_SHAPE_FILL: 54,
    KONVA_SHAPE_FILL_ENABLED: 55,
};
```

## 🎮 Usage

### Basic Shape Drawing

1. Click the shape editor button in the toolbar
2. Select desired shape type from dropdown
3. Adjust color, thickness, and fill options
4. Click and drag on the canvas to create shapes
5. Click on shapes to select and manipulate them

### Programmatic Usage

```javascript
// Initialize konva layer
const builder = new KonvaDrawLayerBuilder({ 
    pageIndex: 0, 
    enableShapeDrawing: true 
});
await builder.render({ intent: "display" });
builder.setParent(pageContainer);

// Get konva layer and draw shapes
const konvaLayer = builder.getKonvaDrawLayer();
const shapeId = konvaLayer.drawShape({
    x: 50, y: 50, radius: 30,
    stroke: '#0066cc', strokeWidth: 3
}, 'circle');

// Export as image
const imageData = konvaLayer.exportAsImage('png');
```

### Serialization

```javascript
// Get shape data for persistence
const shapesData = konvaLayer.getShapesData();

// Save to annotation storage or external system
annotationStorage.setValue(pageId, 'konvaShapes', shapesData);

// Restore shapes later
const savedShapes = annotationStorage.getValue(pageId, 'konvaShapes');
konvaLayer.loadShapesData(savedShapes);
```

## 🧪 Testing

### Demo Page
Access the interactive demo at `examples/konva-shape-demo.html` to test functionality:
- Shape drawing with different types
- Real-time property adjustment
- Export capabilities
- Clear and reset functionality

### Integration Tests
Run the integration tests:
```bash
# In browser environment
open test/konva-integration-test.js

# Tests validate:
# - Module loading
# - Layer initialization  
# - Shape creation and validation
# - Manipulation logic
# - Serialization/deserialization
# - Export functionality
```

## 📦 Dependencies

- **konva**: ^9.2.2 - Canvas 2D library for interactive graphics
- **PDF.js**: Compatible with existing PDF.js architecture

## 🔮 Future Enhancements

### Planned Features
1. **Additional Shape Types**: Polygon, star, path-based shapes
2. **Advanced Styling**: Gradients, patterns, shadows
3. **Shape Groups**: Multi-select and group operations
4. **Snap to Grid**: Alignment helpers and snap functionality
5. **Undo/Redo**: Integration with PDF.js undo system
6. **Touch Support**: Enhanced mobile/tablet interaction

### Extension Points
- Custom shape types via KonvaShapeDrawer extension
- Additional toolbar controls and property panels
- Integration with external shape libraries
- Custom export formats and data structures

## 🤝 Contributing

1. Follow existing PDF.js coding standards and patterns
2. Extend base classes rather than modifying core functionality
3. Add tests for new shape types or features
4. Update documentation for new capabilities

## 📄 License

This implementation follows the same Apache 2.0 license as PDF.js.

---

*This integration demonstrates how external libraries like Konva.js can be seamlessly integrated with PDF.js while maintaining architectural consistency and extensibility.*