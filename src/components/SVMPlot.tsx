import { useRef, useEffect, useState, MouseEvent } from 'react';
import { Point, SVMResult } from '../types';
import { Play, RotateCcw, Trash2, HelpCircle } from 'lucide-react';

interface SVMPlotProps {
  points: Point[];
  result: SVMResult | null;
  onAddPoint: (x: number, y: number) => void;
  onUpdatePoint: (id: string, x: number, y: number) => void;
  onDeletePoint: (id: string) => void;
  onClearPoints: () => void;
  selectedLabel: 1 | -1;
  isCalculating: boolean;
  colorTheme: 'vibrant' | 'classic' | 'contour';
}

export default function SVMPlot({
  points,
  result,
  onAddPoint,
  onUpdatePoint,
  onDeletePoint,
  onClearPoints,
  selectedLabel,
  isCalculating,
  colorTheme,
}: SVMPlotProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showTooltips, setShowTooltips] = useState(true);

  // Constants for coordinate mapping
  const MIN_VAL = -4.0;
  const MAX_VAL = 4.0;
  const RANGE = MAX_VAL - MIN_VAL;

  // Conversion functions: SVM Coords [-4, 4] <-> Canvas Pixels [0, width]
  const toCanvasX = (x: number, width: number) => ((x - MIN_VAL) / RANGE) * width;
  const toCanvasY = (y: number, height: number) => height - ((y - MIN_VAL) / RANGE) * height; // invert Y for standard math orientation

  const toSVMX = (cx: number, width: number) => MIN_VAL + (cx / width) * RANGE;
  const toSVMY = (cy: number, height: number) => MIN_VAL + ((height - cy) / height) * RANGE;

  // Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear Canvas
    ctx.clearRect(0, 0, width, height);

    // 1. Draw SVM Heatmap Background
    if (result && result.gridZ && result.gridZ.length > 0) {
      const gridZ = result.gridZ;
      const res = gridZ.length;
      
      // We can create an imageData buffer for fast pixel rendering
      const imgData = ctx.createImageData(width, height);
      
      // Interpolate values for each pixel
      for (let py = 0; py < height; py++) {
        for (let px = 0; px < width; px++) {
          const sx = toSVMX(px, width);
          const sy = toSVMY(py, height);

          // Bilinear interpolation of gridZ
          // Grid maps x in [-4, 4], y in [-4, 4]
          const gx = ((sx - MIN_VAL) / RANGE) * (res - 1);
          const gy = ((sy - MIN_VAL) / RANGE) * (res - 1);

          const i = Math.max(0, Math.min(res - 2, Math.floor(gx)));
          const j = Math.max(0, Math.min(res - 2, Math.floor(gy)));

          const u = gx - i;
          const v = gy - j;

          // gridZ index ordering: row corresponds to grid_y, col corresponds to grid_x
          const z00 = gridZ[j][i];
          const z10 = gridZ[j][i + 1];
          const z01 = gridZ[j + 1][i];
          const z11 = gridZ[j + 1][i + 1];

          // Bilinear formula
          const z = (1 - u) * (1 - v) * z00 + u * (1 - v) * z10 + (1 - u) * v * z01 + u * v * z11;

          // Map decision value to color
          let r = 255, g = 255, b = 255, a = 255;

          if (colorTheme === 'vibrant') {
            // Soft Blue (Class -1) vs Soft Orange (Class +1)
            // Tanh-like scaling for nice gradient transition
            const conf = Math.tanh(z / 1.5); // value between -1 and 1

            if (conf >= 0) {
              // Rose team: white to beautiful rose/red (244, 63, 94)
              const weight = Math.min(1.0, conf * 0.9);
              r = Math.floor(255 - (255 - 244) * weight);
              g = Math.floor(255 - (255 - 63) * weight);
              b = Math.floor(255 - (255 - 94) * weight);
            } else {
              // Blue team: white to beautiful blue (59, 130, 246)
              const weight = Math.min(1.0, -conf * 0.9);
              r = Math.floor(255 - (255 - 59) * weight);
              g = Math.floor(255 - (255 - 130) * weight);
              b = Math.floor(255 - (255 - 246) * weight);
            }
          } else if (colorTheme === 'contour') {
            // Classic scientific level curves/isocontours using discrete colors
            const absZ = Math.abs(z);
            if (absZ < 0.15) {
              // Decision boundary region
              r = 220; g = 220; b = 220;
            } else if (absZ >= 0.9 && absZ <= 1.1) {
              // Margin boundaries
              r = 230; g = 230; b = 230;
            } else if (z > 0) {
              // Class +1 levels
              const level = Math.floor(z);
              r = 255; g = Math.max(100, 240 - level * 15); b = Math.max(50, 180 - level * 20);
            } else {
              // Class -1 levels
              const level = Math.floor(-z);
              r = Math.max(50, 180 - level * 20); g = Math.max(100, 220 - level * 15); b = 255;
            }
          } else {
            // Classic flat red vs blue
            if (z >= 0) {
              r = 254; g = 244; b = 226; // subtle orange-cream
            } else {
              r = 239; g = 246; b = 255; // subtle blue-white
            }
          }

          const idx = (py * width + px) * 4;
          imgData.data[idx] = r;
          imgData.data[idx + 1] = g;
          imgData.data[idx + 2] = b;
          imgData.data[idx + 3] = a;
        }
      }
      ctx.putImageData(imgData, 0, 0);

      // 2. Draw Decision Boundary & Margin Isocontour lines
      // Let's draw contour lines by locating threshold crossings in our grid
      const drawContour = (threshold: number, color: string, isDashed = false, lineWidth = 1.5) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        if (isDashed) {
          ctx.setLineDash([5, 5]);
        } else {
          ctx.setLineDash([]);
        }

        // Standard Marching Squares or Cell Edge crossing linear interpolation
        const cellW = width / (res - 1);
        const cellH = height / (res - 1);

        for (let j = 0; j < res - 1; j++) {
          for (let i = 0; i < res - 1; i++) {
            const z00 = gridZ[j][i];
            const z10 = gridZ[j][i + 1];
            const z01 = gridZ[j + 1][i];
            const z11 = gridZ[j + 1][i + 1];

            // Corners in pixels
            const x0 = i * cellW;
            const x1 = (i + 1) * cellW;
            // gridY index grows upwards in coordinate system, so gridY[0] is -4, gridY[res-1] is 4
            // and canvas index grows downwards, so we flip the Y
            const y0 = height - (j + 1) * cellH;
            const y1 = height - j * cellH;

            // We examine the 4 edges of the cell
            const edges: { x: number; y: number }[] = [];

            // Bottom edge (between z00 and z10)
            if ((z00 >= threshold && z10 < threshold) || (z00 < threshold && z10 >= threshold)) {
              const t = (threshold - z00) / (z10 - z00);
              edges.push({ x: x0 + t * (x1 - x0), y: y1 });
            }
            // Top edge (between z01 and z11)
            if ((z01 >= threshold && z11 < threshold) || (z01 < threshold && z11 >= threshold)) {
              const t = (threshold - z01) / (z11 - z01);
              edges.push({ x: x0 + t * (x1 - x0), y: y0 });
            }
            // Left edge (between z00 and z01)
            if ((z00 >= threshold && z01 < threshold) || (z00 < threshold && z01 >= threshold)) {
              const t = (threshold - z00) / (z01 - z00);
              edges.push({ x: x0, y: y1 - t * (y1 - y0) });
            }
            // Right edge (between z10 and z11)
            if ((z10 >= threshold && z11 < threshold) || (z10 < threshold && z11 >= threshold)) {
              const t = (threshold - z10) / (z11 - z10);
              edges.push({ x: x1, y: y1 - t * (y1 - y0) });
            }

            if (edges.length >= 2) {
              ctx.moveTo(edges[0].x, edges[0].y);
              ctx.lineTo(edges[1].x, edges[1].y);
            }
          }
        }
        ctx.stroke();
      };

      // Draw margins (Z = -1 and Z = 1)
      drawContour(-1.0, '#3b82f6', true, 1.2); // blue dashed margin
      drawContour(1.0, '#f43f5e', true, 1.2);  // rose dashed margin

      // Draw main separation boundary (Z = 0)
      drawContour(0.0, '#0f172a', false, 2.5); // heavy decision boundary line matching theme #0f172a
    }

    // 3. Draw Grid Axes & Ticks
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 1;

    // Draw horizontal/vertical grid lines every 1 unit
    ctx.fillStyle = '#64748b';
    ctx.font = '10px ui-sans-serif, system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let tick = MIN_VAL; tick <= MAX_VAL; tick += 1) {
      if (tick === 0) continue; // skip zero lines for separate highlighting
      
      const tx = toCanvasX(tick, width);
      const ty = toCanvasY(tick, height);

      // Vertical grid lines
      ctx.beginPath();
      ctx.moveTo(tx, 0);
      ctx.lineTo(tx, height);
      ctx.stroke();

      // Horizontal grid lines
      ctx.beginPath();
      ctx.moveTo(0, ty);
      ctx.lineTo(width, ty);
      ctx.stroke();

      // Axis labels
      const cy0 = toCanvasY(0, height);
      const cx0 = toCanvasX(0, width);

      ctx.fillText(tick.toString(), tx, cy0 + 12);
      ctx.fillText(tick.toString(), cx0 - 12, ty);
    }

    // Draw main X & Y Axes (Zerolines)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 1.5;
    const cx0 = toCanvasX(0, width);
    const cy0 = toCanvasY(0, height);

    ctx.beginPath();
    ctx.moveTo(cx0, 0);
    ctx.lineTo(cx0, height);
    ctx.moveTo(0, cy0);
    ctx.lineTo(width, cy0);
    ctx.stroke();
    ctx.fillText('0', cx0 - 10, cy0 + 10);

    // 4. Draw Data Points
    points.forEach((point) => {
      const px = toCanvasX(point.x, width);
      const py = toCanvasY(point.y, height);
      const isSV = result?.supportVectorIndices && points.findIndex(p => p.id === point.id) !== -1 && result.supportVectorIndices.includes(points.findIndex(p => p.id === point.id));

      const isHovered = point.id === hoveredId;
      const isDragged = point.id === draggedId;

      ctx.save();
      ctx.beginPath();

      // Draw Support Vector heavy double ring halo
      if (isSV) {
        ctx.beginPath();
        if (point.label === 1) {
          // Draw Square support vector outline
          ctx.rect(px - 10, py - 10, 20, 20);
        } else {
          // Draw Circle support vector outline
          ctx.arc(px, py, 11, 0, 2 * Math.PI);
        }
        ctx.strokeStyle = point.label === 1 ? 'rgba(244, 63, 94, 0.45)' : 'rgba(59, 130, 246, 0.45)';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        if (point.label === 1) {
          ctx.rect(px - 8, py - 8, 16, 16);
        } else {
          ctx.arc(px, py, 9, 0, 2 * Math.PI);
        }
        ctx.strokeStyle = '#0f172a'; // Dark slate ring matching support-vector stroke in design HTML
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Hover / Drag Glow Halo
      if (isHovered || isDragged) {
        ctx.beginPath();
        if (point.label === 1) {
          ctx.rect(px - 13, py - 13, 26, 26);
        } else {
          ctx.arc(px, py, 14, 0, 2 * Math.PI);
        }
        ctx.fillStyle = point.label === 1 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(59, 130, 246, 0.15)';
        ctx.fill();
      }

      // Draw Point shape
      ctx.beginPath();
      if (point.label === 1) {
        // Rose Square for Class +1
        const r = 5.5;
        ctx.rect(px - r, py - r, r * 2, r * 2);
        ctx.fillStyle = '#f43f5e'; // vibrant rose/red
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
      } else {
        // Blue Circle for Class -1
        ctx.arc(px, py, 5.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#3b82f6'; // vibrant blue
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
      }

      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });

  }, [points, result, hoveredId, draggedId, colorTheme]);

  // Handle Resize or layout container checking
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const size = Math.min(container.clientWidth, 480);
      canvas.width = size;
      canvas.height = size;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mouse Handlers for Dragging, Hovering & Adding points
  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    // Check if we clicked close to any point to start a drag
    let clickedPoint: Point | null = null;
    let minDist = 12; // hit test range

    points.forEach((point) => {
      const px = toCanvasX(point.x, canvas.width);
      const py = toCanvasY(point.y, canvas.height);
      const dist = Math.hypot(cx - px, cy - py);
      if (dist < minDist) {
        minDist = dist;
        clickedPoint = point;
      }
    });

    if (clickedPoint) {
      if (e.shiftKey) {
        // Shift + Click deletes the point
        onDeletePoint((clickedPoint as Point).id);
        setHoveredId(null);
      } else {
        setDraggedId((clickedPoint as Point).id);
      }
    } else {
      // Clicked on empty space: Add a new point of the currently active class
      const sx = toSVMX(cx, canvas.width);
      const sy = toSVMY(cy, canvas.height);
      
      // Keep inside bounds
      if (sx >= MIN_VAL && sx <= MAX_VAL && sy >= MIN_VAL && sy <= MAX_VAL) {
        onAddPoint(sx, sy);
      }
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    if (draggedId) {
      // Update dragged point's position in real-time
      const sx = Math.max(MIN_VAL, Math.min(MAX_VAL, toSVMX(cx, canvas.width)));
      const sy = Math.max(MIN_VAL, Math.min(MAX_VAL, toSVMY(cy, canvas.height)));
      onUpdatePoint(draggedId, sx, sy);
    } else {
      // Check for hover
      let hovered: Point | null = null;
      let minDist = 10;

      points.forEach((point) => {
        const px = toCanvasX(point.x, canvas.width);
        const py = toCanvasY(point.y, canvas.height);
        const dist = Math.hypot(cx - px, cy - py);
        if (dist < minDist) {
          minDist = dist;
          hovered = point;
        }
      });

      setHoveredId(hovered ? (hovered as Point).id : null);
    }
  };

  const handleMouseUp = () => {
    setDraggedId(null);
  };

  return (
    <div className="flex flex-col items-center bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm w-full">
      {/* Simulation Plot Header Controls */}
      <div className="flex items-center justify-between w-full mb-3.5">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-semibold text-slate-800">Visual Boundary Plot</span>
          {isCalculating && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 animate-pulse border border-amber-200/50">
              Fitting SVM...
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowTooltips(!showTooltips)}
            className={`p-1.5 rounded-lg border text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors ${
              showTooltips ? 'bg-indigo-50 border-indigo-200/60 text-indigo-600' : 'bg-white border-slate-200'
            }`}
            title="Toggle interaction guides"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={onClearPoints}
            className="flex items-center px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200/50 rounded-lg hover:bg-red-100/80 hover:border-red-300 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Clear Plot
          </button>
        </div>
      </div>

      {/* Interactive Legend / Mode selection */}
      <div className="flex flex-wrap items-center justify-center gap-4 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 mb-4 w-full">
        <div className="text-xs text-slate-500 font-medium">Click to add:</div>
        
        <button
          onClick={() => {}} // Controlled by external state through props mostly
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg border text-xs font-semibold shadow-sm transition-all cursor-default ${
            selectedLabel === -1
              ? 'bg-blue-50 border-blue-200 text-blue-700 ring-2 ring-blue-500/15'
              : 'bg-white border-slate-200 text-slate-400 opacity-60'
          }`}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-white" />
          <span>Class -1 (Blue Circles)</span>
        </button>

        <button
          onClick={() => {}}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg border text-xs font-semibold shadow-sm transition-all cursor-default ${
            selectedLabel === 1
              ? 'bg-rose-50 border-rose-200 text-rose-700 ring-2 ring-rose-500/15'
              : 'bg-white border-slate-200 text-slate-400 opacity-60'
          }`}
        >
          <div className="w-2.5 h-2.5 bg-rose-500 border border-white" />
          <span>Class +1 (Rose Squares)</span>
        </button>
      </div>

      {/* Main Canvas Area */}
      <div ref={containerRef} className="relative aspect-square border border-slate-200 rounded-xl overflow-hidden shadow-inner bg-slate-50 w-full flex items-center justify-center cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="block select-none"
        />

        {/* Guides overlay */}
        {showTooltips && points.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/65 backdrop-blur-[1.5px] p-6 text-center text-white transition-opacity duration-300">
            <div className="bg-indigo-600 p-2.5 rounded-full shadow-lg mb-3">
              <Play className="w-6 h-6 fill-white" />
            </div>
            <p className="font-bold text-base mb-1">Click the Plot to Begin!</p>
            <p className="text-xs text-slate-200 max-w-xs leading-relaxed">
              Add points dynamically by clicking, or choose a **Dataset Preset** in the sidebar. 
              Drag existing points around to see the decision boundary adjust instantly!
            </p>
            <p className="text-[10px] text-slate-300 mt-4 font-mono bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-white/10">
              Shift + Click a point to Delete it.
            </p>
            <button
              onClick={() => setShowTooltips(false)}
              className="mt-5 px-3 py-1.5 text-xs font-semibold bg-white/20 hover:bg-white/30 rounded-lg border border-white/20 transition-all cursor-pointer"
            >
              Got it
            </button>
          </div>
        )}
      </div>

      {/* Interactive Helper Legend */}
      <div className="flex justify-between items-center w-full mt-3 text-[11px] text-slate-400 border-t border-slate-100 pt-3">
        <div className="flex items-center space-x-1.5">
          <div className="w-4 h-0.5 border-t border-dashed border-blue-500" />
          <span>Margin -1</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-5 h-0.5 bg-slate-800" />
          <span>Decision Boundary (Z = 0)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-4 h-0.5 border-t border-dashed border-rose-500" />
          <span>Margin +1</span>
        </div>
      </div>
      
      {result?.supportVectorIndices && (
        <div className="flex items-center space-x-1.5 mt-2.5 text-[11px] text-slate-500 font-medium">
          <div className="w-3 h-3 rounded-full border border-slate-400 bg-transparent flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          </div>
          <span>Support Vector Halo Highlights ({result.supportVectorIndices.length} total)</span>
        </div>
      )}
    </div>
  );
}
