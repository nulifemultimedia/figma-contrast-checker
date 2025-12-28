// This plugin checks color contrast for accessibility

figma.showUI(__html__, {
  width: 380,
  height: 600,
  themeColors: true
});

function getNodeColor(node: SceneNode): { r: number; g: number; b: number } | null {
  // Try to get color from fills first
  if ('fills' in node && Array.isArray(node.fills) && node.fills.length > 0) {
    const fills = node.fills as readonly Paint[];
    const solidFill = fills.find(fill => fill.type === 'SOLID' && fill.visible !== false) as SolidPaint | undefined;
    
    if (solidFill) {
      return {
        r: Math.round(solidFill.color.r * 255),
        g: Math.round(solidFill.color.g * 255),
        b: Math.round(solidFill.color.b * 255)
      };
    }
  }
  
  // Fallback to stroke color if no fill
  if ('strokes' in node && Array.isArray(node.strokes) && node.strokes.length > 0) {
    const strokes = node.strokes as readonly Paint[];
    const solidStroke = strokes.find(stroke => stroke.type === 'SOLID' && stroke.visible !== false) as SolidPaint | undefined;
    
    if (solidStroke) {
      return {
        r: Math.round(solidStroke.color.r * 255),
        g: Math.round(solidStroke.color.g * 255),
        b: Math.round(solidStroke.color.b * 255)
      };
    }
  }
  
  return null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

let isPickingColor = false;
let pickTarget: 'foreground' | 'background' | null = null;

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'pick-color') {
    isPickingColor = true;
    pickTarget = msg.target;
    
    figma.ui.postMessage({
      type: 'pick-mode-active',
      target: msg.target
    });
    
    // Change cursor to indicate picking mode
    figma.viewport.zoom = figma.viewport.zoom; // Trigger cursor change
    
    // Wait for user to click on canvas
    figma.on('selectionchange', handleSelectionChange);
  }
};

async function handleSelectionChange() {
  if (!isPickingColor || !pickTarget) {
    return;
  }
  
  const selection = figma.currentPage.selection;
  
  if (selection.length > 0) {
    const node = selection[0];
    const color = getNodeColor(node);
    
    if (color) {
      const hex = rgbToHex(color.r, color.g, color.b);
      
      figma.ui.postMessage({
        type: 'color-picked',
        color: hex,
        target: pickTarget
      });
    } else {
      figma.ui.postMessage({
        type: 'color-pick-error',
        message: 'Selected node does not have a solid color fill or stroke'
      });
    }
    
    // Reset picking state
    isPickingColor = false;
    pickTarget = null;
    figma.off('selectionchange', handleSelectionChange);
  }
}

// Handle plugin close
figma.on('close', () => {
  if (isPickingColor) {
    figma.off('selectionchange', handleSelectionChange);
  }
});

