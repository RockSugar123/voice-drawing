export const OPERATION_SCHEMA = `
Available operations (return JSON array "operations"):

1. create_shape - Create a shape
   { "op": "create_shape", "type": "circle|rect|triangle|ellipse", "x": number, "y": number, "w": number?, "h": number?, "r": number?, "color": "#hex", "fill": true|false }
   - circle uses r (radius)
   - rect uses w (width), h (height)
   - triangle uses w, h
   - ellipse uses w, h

2. create_line - Create a line/path
   { "op": "create_line", "points": [{"x":n,"y":n},...], "color": "#hex", "width": number }

3. freehand - Freehand curve (same params as create_line)
   { "op": "freehand", "points": [{"x":n,"y":n},...], "color": "#hex", "width": number }

4. move - Move an element
   { "op": "move", "target_id": "e1", "dx": number, "dy": number }

5. resize - Resize an element
   { "op": "resize", "target_id": "e1", "scale_x": number, "scale_y": number }

6. delete - Delete an element
   { "op": "delete", "target_id": "e1" }

7. recolor - Change color
   { "op": "recolor", "target_id": "e1", "color": "#hex" }

8. clear - Clear the canvas
   { "op": "clear" }

9. undo - Undo last action
   { "op": "undo" }

10. redo - Redo undone action
    { "op": "redo" }
`;

export const POSITIONING_RULES = `
Canvas coordinate system:
- Canvas size: 800x600 (width x height)
- (0,0) is top-left, (800,600) is bottom-right
- Coordinates refer to the CENTER of each shape

Nine-grid zone mapping:
- "top-left" / "左上" / "左上角" → (120, 90)
- "top" / "上" / "上方" → (400, 90)
- "top-right" / "右上" / "右上角" → (680, 90)
- "left" / "左" / "左边" → (120, 300)
- "center" / "中间" / "中心" → (400, 300)
- "right" / "右" / "右边" → (680, 300)
- "bottom-left" / "左下" / "左下角" → (120, 510)
- "bottom" / "下" / "下方" / "底部" → (400, 510)
- "bottom-right" / "右下" / "右下角" → (680, 510)

Offset rules:
- "a little" / "一点" / "一下" → 40px
- "some" / "一些" → 80px
- "a lot" / "很多" → 160px
- "left" / "往左" / "向左" → dx negative (-40 etc)
- "right" / "往右" / "向右" → dx positive
- "up" / "往上" / "向上" → dy negative
- "down" / "往下" / "向下" → dy positive
- "bigger" / "变大" / "放大" → scale 1.5
- "a bit smaller" / "小一点" → scale 0.8
- "double" / "放大两倍" → scale 2.0
- "half" / "缩小一半" → scale 0.5

Color keyword mapping:
- "red" / "红色" → "#FF4444"
- "blue" / "蓝色" → "#4488FF"
- "green" / "绿色" → "#44CC44"
- "yellow" / "黄色" → "#FFD700"
- "black" / "黑色" → "#333333"
- "white" / "白色" → "#FFFFFF"
- "orange" / "橙色" → "#FF8800"
- "purple" / "紫色" → "#AA44FF"
- "pink" / "粉色" → "#FF88CC"
- "gray" / "灰色" → "#888888"
- "brown" / "棕色" → "#8B4513"
`;

export const CONTEXT_RULES = `
Context reference rules:
- "it" / "这个" / "那个" → refers to the element ID from the previous operation
- "the Nth one" / "第X个" → index by creation order (starting from 1)
- "the red one" / "红色的那个" → find element matching color
- "the one on the left" / "左边那个" → find element by position
- "all" / "所有的" / "全部" → match all elements (split into multiple operations)
- If target_id cannot be determined, ask user to clarify in reply
`;

export const COMPOUND_DECOMPOSITION = `
Compound instruction decomposition - automatically split common patterns:

"house" / "房子" → [
  create_shape rect (wall, brown, w:120 h:100),
  create_shape triangle (roof, red, w:140 h:60, positioned above wall),
  create_shape rect (door, brown, w:30 h:50, bottom center of wall),
  create_shape rect (left window, blue, w:25 h:25),
  create_shape rect (right window, blue, w:25 h:25)
]

"smiley face" / "笑脸" → [
  create_shape circle (face, yellow, r:60),
  create_shape circle (left eye, #333, r:6, positioned upper-left of face center),
  create_shape circle (right eye, #333, r:6, positioned upper-right of face center),
  create_line (mouth, arc path, positioned lower part of face)
]

"tree" / "树" → [
  create_shape rect (trunk, brown, w:30 h:100),
  create_shape circle (canopy, green, r:60, positioned above trunk)
]

Principle: sub-elements in compound instructions should have coordinates relative to the overall position to maintain visual reasonableness.
`;
