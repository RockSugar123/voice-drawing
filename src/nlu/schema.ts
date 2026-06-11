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
Compound instruction decomposition — automatically split common phrases into multiple operations:

=== Buildings ===

"house" / "房子" → [
  create_shape rect (wall, brown/#8B4513, x, y, w:120 h:100),
  create_shape triangle (roof, red/#FF4444, x, y-roof_offset, w:140 h:60),
  create_shape rect (door, brown, x, y+25, w:30 h:50),
  create_shape rect (left window, blue/#4488FF, x-35, y-10, w:25 h:25),
  create_shape rect (right window, blue, x+35, y-10, w:25 h:25)
]

"castle" / "城堡" → [
  create_shape rect (main wall, gray/#888888, x, y, w:160 h:120),
  create_shape rect (left tower, gray, x-70, y-20, w:40 h:100),
  create_shape rect (right tower, gray, x+70, y-20, w:40 h:100),
  create_shape triangle (left tower top, red, x-70, y-80, w:50 h:40),
  create_shape triangle (right tower top, red, x+70, y-80, w:50 h:40),
  create_shape rect (gate, brown, x, y+35, w:35 h:50),
  create_shape rect (main roof, gray, x, y-55, w:170 h:10)
]

=== Nature ===

"tree" / "树" → [
  create_shape rect (trunk, brown/#8B4513, x, y, w:30 h:100),
  create_shape circle (canopy, green/#44CC44, x, y-60, r:60)
]

"sun" / "太阳" → [
  create_shape circle (sun body, yellow/#FFD700, x, y, r:50),
  create_line (rays, multiple short lines radiating outward in 8 directions from center)
]

"moon" / "月亮" → [
  create_shape circle (moon, yellow/#FFD700, x, y, r:45),
  create_shape circle (shadow, same color as background, x+15, y-5, r:35)
]

"cloud" / "云朵" / "云" → [
  create_shape circle (center, white/#FFFFFF, x, y, r:35),
  create_shape circle (left, white, x-30, y+5, r:25),
  create_shape circle (right, white, x+30, y+5, r:28),
  create_shape circle (top, white, x, y-20, r:22)
]

"flower" / "花" → [
  create_shape circle (center, yellow/#FFD700, x, y, r:12),
  create_shape circle (petal top, pink/#FF88CC, x, y-25, r:18),
  create_shape circle (petal right, pink, x+25, y, r:18),
  create_shape circle (petal bottom, pink, x, y+25, r:18),
  create_shape circle (petal left, pink, x-25, y, r:18),
  create_shape circle (petal tr, pink, x+18, y-18, r:18),
  create_shape circle (petal br, pink, x+18, y+18, r:18),
  create_shape circle (petal bl, pink, x-18, y+18, r:18),
  create_shape circle (petal tl, pink, x-18, y-18, r:18),
  create_shape rect (stem, green/#44CC44, x, y+40, w:6 h:70)
]

"mountain" / "山" → [
  create_shape triangle (left peak, gray/#888888, x-60, y, w:140 h:160),
  create_shape triangle (right peak, gray, x+50, y-20, w:120 h:130),
  create_shape triangle (snow cap left, white, x-60, y-70, w:60 h:30),
  create_shape triangle (snow cap right, white, x+50, y-75, w:50 h:25)
]

=== Faces & Emoji ===

"smiley" / "笑脸" / "smiley face" → [
  create_shape circle (face, yellow/#FFD700, x, y, r:60),
  create_shape circle (left eye, #333, x-18, y-15, r:6),
  create_shape circle (right eye, #333, x+18, y-15, r:6),
  create_line (smile mouth, #333, arc from x-20,y+12 to x+20,y+12 curving down, width:2)
]

"sad face" / "哭脸" → [
  create_shape circle (face, yellow/#FFD700, x, y, r:60),
  create_shape circle (left eye, #333, x-18, y-15, r:6),
  create_shape circle (right eye, #333, x+18, y-15, r:6),
  create_line (frown mouth, #333, arc from x-20,y+20 to x+20,y+20 curving up, width:2),
  create_shape circle (tear left, blue/#4488FF, x-12, y+30, r:4),
  create_shape circle (tear right, blue, x+8, y+32, r:3)
]

"heart" / "心形" → [
  create_shape circle (left lobe, red/#FF4444, x-18, y-8, r:20),
  create_shape circle (right lobe, red, x+18, y-8, r:20),
  create_shape triangle (bottom point, red, x, y+22, w:50 h:35)
]

"star" / "五角星" / "星星" →
  Use a 5-pointed star approximation: create_shape triangle (top point, yellow/#FFD700, x, y-35, w:20 h:40), plus 4 more triangles rotated to form a star pattern. Alternatively, use create_line with 10-point path for the star outline.

=== Vehicles ===

"car" / "汽车" → [
  create_shape rect (body, red/#FF4444, x, y, w:160 h:50),
  create_shape rect (cabin, red, x, y-25, w:80 h:40),
  create_shape circle (left wheel, #333, x-55, y+25, r:18),
  create_shape circle (right wheel, #333, x+55, y+25, r:18),
  create_shape circle (left hub, gray, x-55, y+25, r:8),
  create_shape circle (right hub, gray, x+55, y+25, r:8)
]

"boat" / "船" → [
  create_shape triangle (hull, brown/#8B4513, x, y, w:140 h:50),
  create_shape rect (mast, brown, x, y-65, w:6 h:70),
  create_shape triangle (sail, white/#FFFFFF, x+3, y-60, w:50 h:50)
]

"rocket" / "火箭" → [
  create_shape rect (body, gray/#888888, x, y, w:30 h:100),
  create_shape triangle (nose, red/#FF4444, x, y-65, w:40 h:40),
  create_shape triangle (left fin, red, x-20, y+30, w:20 h:25),
  create_shape triangle (right fin, red, x+20, y+30, w:20 h:25),
  create_shape circle (window, blue/#4488FF, x, y-10, r:8),
  create_shape ellipse (flame, orange/#FF8800, x, y+55, w:20 h:25)
]

=== People & Characters ===

"snowman" / "雪人" → [
  create_shape circle (bottom, white/#FFFFFF, x, y, r:45),
  create_shape circle (middle, white, x, y-55, r:35),
  create_shape circle (head, white, x, y-95, r:25),
  create_shape circle (left eye, #333, x-8, y-100, r:4),
  create_shape circle (right eye, #333, x+8, y-100, r:4),
  create_shape triangle (nose, orange/#FF8800, x, y-93, w:6 h:15),
  create_shape rect (hat brim, #333, x, y-115, w:35 h:4),
  create_shape rect (hat top, #333, x, y-130, w:25 h:25)
]

"robot" / "机器人" → [
  create_shape rect (head, gray/#888888, x, y-80, w:50 h:50),
  create_shape circle (left eye, yellow/#FFD700, x-12, y-85, r:7),
  create_shape circle (right eye, yellow, x+12, y-85, r:7),
  create_shape rect (body, gray, x, y-10, w:60 h:70),
  create_shape rect (left arm, gray, x-45, y-15, w:15 h:50),
  create_shape rect (right arm, gray, x+45, y-15, w:15 h:50),
  create_shape rect (left leg, gray, x-15, y+40, w:18 h:45),
  create_shape rect (right leg, gray, x+15, y+40, w:18 h:45)
]

=== Objects ===

"clock" / "钟" / "时钟" → [
  create_shape circle (face, white/#FFFFFF, x, y, r:50),
  create_shape circle (center dot, #333, x, y, r:4),
  create_line (hour hand, #333, x to x,y-20, width:3),
  create_line (minute hand, #333, x to x+25,y, width:2)
]

"umbrella" / "雨伞" → [
  create_shape triangle (canopy, red/#FF4444, x, y-20, w:120 h:60),
  create_shape rect (handle, brown, x, y+10, w:4 h:40),
  create_line (handle curve, brown, arc from x,y+45 curving left, width:3)
]

"fish" / "鱼" → [
  create_shape ellipse (body, orange/#FF8800, x, y, w:100 h:50),
  create_shape triangle (tail, orange, x-60, y, w:25 h:30),
  create_shape circle (eye, #333, x+30, y-8, r:5),
  create_line (mouth, #333, from x+48,y to x+55,y)
]

=== Layout Templates ===

"three circles in a row" / "一排三个圆" → [
  create_shape circle (first, x-100, y, r:30),
  create_shape circle (second, x, y, r:30),
  create_shape circle (third, x+100, y, r:30)
]

"traffic light" / "红绿灯" → [
  create_shape rect (housing, #333, x, y, w:55 h:140),
  create_shape circle (red light, red/#FF4444, x, y-45, r:17),
  create_shape circle (yellow light, yellow/#FFD700, x, y, r:17),
  create_shape circle (green light, green/#44CC44, x, y+45, r:17)
]

=== Principles ===
- All sub-element coordinates should be relative to the user's stated position (if none stated, use center (400,300))
- Maintain visual reasonableness — sub-elements should not overlap in broken ways
- Use approximate coordinates; the canvas engine will clamp them
- If the user specifies a color ("red house"), override the default colors
- If no position is given, default to center of canvas
`;

