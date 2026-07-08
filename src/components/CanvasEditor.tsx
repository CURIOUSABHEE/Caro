"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Stage, Layer, Rect, Text as KonvaText, Image as KonvaImage, Transformer, Group } from "react-konva";
import type Konva from "konva";
import {
  X, Trash2, ImageIcon, TypeIcon, AlignLeft, AlignCenter, AlignRight, Bold, Italic,
  ChevronDown, GripHorizontal, ZoomIn, ZoomOut, Move, RotateCcw, Plus, Minus,
  ArrowUp, ArrowDown, Copy, Undo2, Redo2, Maximize,
} from "lucide-react";

export interface CanvasElement {
  id: string;
  type: "text" | "image";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  content?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  textAlign?: CanvasTextAlign;
  fontStyle?: "normal" | "italic";
  src?: string;
  borderRadius?: number;
  strokeColor?: string;
  strokeWidth?: number;
}

interface CanvasEditorProps {
  initialElements: CanvasElement[];
  onSave: (elements: CanvasElement[], pngDataUrl: string) => void;
  onClose: () => void;
  bgImageUrl?: string;
}

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1350;

const FONT_FAMILIES = ["Outfit", "Playfair Display", "Caveat", "JetBrains Mono", "Georgia", "Arial"];
const PRESET_COLORS = [
  "#000000", "#ffffff", "#2563eb", "#ef4444",
  "#10b981", "#f59e0b", "#7c3aed", "#db2777",
  "#f97316", "#06b6d4", "#84cc16", "#78716c",
];

function useLoadedImage(src?: string) {
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!src) { setImageObj(null); return; }
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    let cancelled = false;
    img.onload = () => { if (!cancelled) setImageObj(img); };
    img.src = src;
    return () => { cancelled = true; img.onload = null; };
  }, [src]);
  return imageObj;
}

function useHistory<T>(initialState: T) {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [pointer, setPointer] = useState<number>(0);

  const set = useCallback((val: T) => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, pointer + 1);
      newHistory.push(val);
      return newHistory;
    });
    setPointer((prev) => prev + 1);
  }, [pointer]);

  const undo = useCallback(() => {
    if (pointer > 0) setPointer((prev) => prev - 1);
  }, [pointer]);

  const redo = useCallback(() => {
    if (pointer < history.length - 1) setPointer((prev) => prev + 1);
  }, [pointer, history.length]);

  return [history[pointer], set, undo, redo, pointer > 0, pointer < history.length - 1] as const;
}

function ImageElementComponent({ el, onSelect, onChange }: {
  el: CanvasElement;
  onSelect: () => void;
  onChange: (updates: Partial<CanvasElement>) => void;
}) {
  const shapeRef = useRef<Konva.Image>(null);
  const imageObj = useLoadedImage(el.src);

  return (
    <KonvaImage
      id={`element_${el.id}`}
      ref={shapeRef}
      image={imageObj || undefined}
      x={el.x}
      y={el.y}
      width={el.width}
      height={el.height}
      rotation={el.rotation}
      draggable
      onClick={(e) => { e.cancelBubble = true; onSelect(); }}
      onTap={(e) => { e.cancelBubble = true; onSelect(); }}
      onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
      onTransformEnd={() => {
        const node = shapeRef.current;
        if (!node) return;
        const sx = node.scaleX();
        const sy = node.scaleY();
        onChange({
          x: node.x(),
          y: node.y(),
          width: Math.max(10, node.width() * sx),
          height: Math.max(10, node.height() * sy),
          rotation: node.rotation(),
        });
        node.scaleX(1);
        node.scaleY(1);
      }}
      stroke={el.strokeColor}
      strokeWidth={el.strokeWidth || 0}
      cornerRadius={el.borderRadius || 0}
      strokeScaleEnabled={false}
    />
  );
}

function TextElementComponent({ el, onSelect, onChange, isEditing }: {
  el: CanvasElement;
  onSelect: () => void;
  onChange: (updates: Partial<CanvasElement>) => void;
  isEditing: boolean;
}) {
  const shapeRef = useRef<Konva.Text>(null);

  return (
    <KonvaText
      id={`element_${el.id}`}
      ref={shapeRef}
      x={el.x}
      y={el.y}
      width={el.width}
      height={el.height}
      rotation={el.rotation}
      text={el.content || ""}
      fontFamily={el.fontFamily || "Outfit"}
      fontSize={el.fontSize || 48}
      fontStyle={el.fontStyle || "normal"}
      fill={el.color || "#000000"}
      align={el.textAlign || "left"}
      draggable={!isEditing}
      opacity={isEditing ? 0 : 1}
      onClick={(e) => { e.cancelBubble = true; onSelect(); }}
      onTap={(e) => { e.cancelBubble = true; onSelect(); }}
      onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
      onTransformEnd={() => {
        const node = shapeRef.current;
        if (!node) return;
        const sx = node.scaleX();
        const sy = node.scaleY();
        onChange({
          x: node.x(),
          y: node.y(),
          width: Math.max(10, node.width() * sx),
          height: Math.max(10, node.height() * sy),
          rotation: node.rotation(),
        });
        node.scaleX(1);
        node.scaleY(1);
      }}
    />
  );
}

export default function CanvasEditor({ initialElements, onSave, onClose, bgImageUrl }: CanvasEditorProps) {
  const [elements, setElements, undo, redo, canUndo, canRedo] = useHistory<CanvasElement[]>(initialElements);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [stageScale, setStageScale] = useState(0.5);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  
  const [isTextEditing, setIsTextEditing] = useState(false);
  const [editTextValue, setEditTextValue] = useState("");
  const [editTextId, setEditTextId] = useState<string | null>(null);
  const [editorRect, setEditorRect] = useState<{ x: number, y: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [stageDimensions, setStageDimensions] = useState({ width: 1000, height: 800 });

  const selectedElement = elements.find(el => el.id === selectedId);
  const bgImageObj = useLoadedImage(bgImageUrl);

  // Fit stage to container initially and on resize (reset zoom)
  const fitToScreen = useCallback(() => {
    if (containerRef.current) {
      const w = containerRef.current.offsetWidth;
      const h = containerRef.current.offsetHeight;
      setStageDimensions({ width: w, height: h });
      const scale = Math.min(w / CANVAS_WIDTH, h / CANVAS_HEIGHT) * 0.85;
      setStageScale(scale);
      setStagePosition({
        x: (w - CANVAS_WIDTH * scale) / 2,
        y: (h - CANVAS_HEIGHT * scale) / 2,
      });
    }
  }, []);

  useEffect(() => {
    fitToScreen();
    window.addEventListener("resize", fitToScreen);
    return () => window.removeEventListener("resize", fitToScreen);
  }, [fitToScreen]);

  // Handle zooming
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    if (!e || !e.evt) return;
    e.evt.preventDefault();
    if (isTextEditing) return; // Prevent zooming while typing

    const stage = stageRef.current;
    if (!stage) return;
    
    // Ctrl+Wheel or Trackpad zoom is mostly handled natively via wheel events
    const scaleBy = 1.05;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    
    // Zoom direction
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    let newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    newScale = Math.max(0.1, Math.min(newScale, 5)); // Bound between 10% and 500%
    
    setStageScale(newScale);
    setStagePosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
  }, [elements, setElements]);

  const deleteSelected = useCallback(() => {
    if (selectedId) {
      setElements(elements.filter(el => el.id !== selectedId));
      setSelectedId(null);
    }
  }, [selectedId, elements, setElements]);

  const duplicateSelected = useCallback(() => {
    const el = elements.find(e => e.id === selectedId);
    if (!el) return;
    const newEl = { ...el, id: `el_${Date.now()}`, x: el.x + 20, y: el.y + 20 };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  }, [selectedId, elements, setElements]);

  const bringForward = useCallback(() => {
    if (!selectedId) return;
    const idx = elements.findIndex(e => e.id === selectedId);
    if (idx < elements.length - 1) {
      const newArr = [...elements];
      const temp = newArr[idx];
      newArr[idx] = newArr[idx + 1];
      newArr[idx + 1] = temp;
      setElements(newArr);
    }
  }, [selectedId, elements, setElements]);

  const sendBackward = useCallback(() => {
    if (!selectedId) return;
    const idx = elements.findIndex(e => e.id === selectedId);
    if (idx > 0) {
      const newArr = [...elements];
      const temp = newArr[idx];
      newArr[idx] = newArr[idx - 1];
      newArr[idx - 1] = temp;
      setElements(newArr);
    }
  }, [selectedId, elements, setElements]);

  // Keyboard shortcuts (Space to pan, Undo/Redo, Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input or textarea
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
      
      if (e.code === "Space") {
        e.preventDefault();
        setIsPanning(true);
      }
      
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault();
        if (selectedId) duplicateSelected();
      }

      if (e.key === "Backspace" || e.key === "Delete") {
        if (selectedId) deleteSelected();
      }

      if (e.key === "]" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (selectedId) bringForward();
      }

      if (e.key === "[" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (selectedId) sendBackward();
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsPanning(false);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    }
  }, [isTextEditing, selectedId, undo, redo, duplicateSelected, deleteSelected, bringForward, sendBackward]);

  // Update transformer nodes
  useEffect(() => {
    if (!trRef.current || !stageRef.current || isTextEditing) return;
    const stage = stageRef.current;
    let node = null;
    if (selectedId) {
      try { node = stage.findOne(`#element_${selectedId}`); } catch {}
    }
    trRef.current.nodes(node ? [node] : []);
    trRef.current.getLayer?.()?.batchDraw();
  }, [selectedId, elements, isTextEditing]);

  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (e.target === e.target.getStage()) {
      setSelectedId(null);
      if (isTextEditing) commitTextEdit();
    }
  }, [isTextEditing]); // eslint-disable-line

  const handleDoubleClick = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const target = e.target;
    if (!target) return;
    const id = target.id();
    if (!id || !id.startsWith("element_")) return;
    const elId = id.replace("element_", "");
    const el = elements.find(e => e.id === elId);
    if (el && el.type === "text") {
      setEditTextValue(el.content || "");
      setEditTextId(elId);
      setIsTextEditing(true);
      
      const pos = target.getAbsolutePosition();
      setEditorRect({ x: pos.x, y: pos.y });
    }
  }, [elements]);

  const commitTextEdit = useCallback(() => {
    if (editTextId !== null) {
      updateElement(editTextId, { content: editTextValue });
    }
    setIsTextEditing(false);
    setEditTextId(null);
    setEditorRect(null);
  }, [editTextId, editTextValue, updateElement]);

  const addTextElement = useCallback(() => {
    const newEl: CanvasElement = {
      id: `el_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type: "text",
      x: 100,
      y: 100,
      width: 500,
      height: 80,
      rotation: 0,
      content: "New Text",
      fontFamily: "Outfit",
      fontSize: 64,
      fontWeight: "800",
      color: "#000000",
      textAlign: "center",
      fontStyle: "normal",
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  }, [elements, setElements]);

  const addImageElement = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size exceeds 5MB limit.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        const newEl: CanvasElement = {
          id: `el_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          type: "image",
          x: 200,
          y: 200,
          width: 400,
          height: 300,
          rotation: 0,
          src,
          borderRadius: 0,
          strokeColor: "#000000",
          strokeWidth: 0,
        };
        setElements([...elements, newEl]);
        setSelectedId(newEl.id);
      };
      reader.readAsDataURL(file);
    };
    input.click();
    setFileInputKey(k => k + 1);
  }, [elements, setElements]);

  const handleSave = useCallback(async () => {
    if (!stageRef.current) return;
    setIsSaving(true);
    
    // Deselect everything so transformer doesn't show up in export
    setSelectedId(null);
    trRef.current?.nodes([]);
    
    // Wait a tick for UI to update
    setTimeout(() => {
      try {
        const dataUrl = (stageRef.current?.toDataURL({ pixelRatio: 2 }) || "");
        onSave(elements, dataUrl);
      } catch (err) {
        console.error("Failed to export canvas:", err);
      } finally {
        setIsSaving(false);
      }
    }, 100);
  }, [elements, onSave]);

  // Inline Editor Component mapping Konva position to DOM position
  const renderInlineEditor = () => {
    if (!isTextEditing || !editTextId || !editorRect) return null;
    const el = elements.find(e => e.id === editTextId);
    if (!el) return null;

    return (
      <textarea
        value={editTextValue}
        onChange={(e) => setEditTextValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            commitTextEdit();
          }
          if (e.key === "Escape") {
            setIsTextEditing(false);
            setEditTextId(null);
          }
        }}
        autoFocus
        style={{
          position: "absolute",
          top: editorRect.y + "px",
          left: editorRect.x + "px",
          width: el.width * stageScale + "px",
          height: Math.max(el.height, 100) * stageScale + "px",
          fontSize: (el.fontSize || 48) * stageScale + "px",
          fontFamily: el.fontFamily || "Outfit",
          fontWeight: el.fontWeight || "400",
          color: el.color || "#000000",
          textAlign: el.textAlign || "left",
          fontStyle: el.fontStyle || "normal",
          transform: `rotate(${el.rotation || 0}deg)`,
          transformOrigin: "top left",
          border: "2px solid #3b82f6",
          borderRadius: "4px",
          padding: 0,
          margin: 0,
          background: "transparent",
          zIndex: 100,
          resize: "none",
          outline: "none",
          lineHeight: 1.2,
          overflow: "hidden"
        }}
      />
    );
  };

  return (
    <div className="fixed inset-0 bg-neutral-100 z-50 flex flex-col font-sans">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-200 shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-all">
            <X className="h-5 w-5" />
          </button>
          <div className="h-5 w-px bg-neutral-200" />
          <div className="flex items-center gap-1">
            <button onClick={undo} disabled={!canUndo} className="p-2 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent" title="Undo (Cmd+Z)">
              <Undo2 className="h-4 w-4" />
            </button>
            <button onClick={redo} disabled={!canRedo} className="p-2 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent" title="Redo (Cmd+Shift+Z)">
              <Redo2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={addTextElement}
            className="px-4 py-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 font-semibold rounded-lg transition-all flex items-center gap-2 text-sm border border-neutral-200"
          >
            <TypeIcon className="h-4 w-4" /> Text
          </button>
          <button
            onClick={addImageElement}
            className="px-4 py-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 font-semibold rounded-lg transition-all flex items-center gap-2 text-sm border border-neutral-200"
          >
            <ImageIcon className="h-4 w-4" /> Image
          </button>
          <div className="h-5 w-px bg-neutral-200 mx-2" />
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all text-sm disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save & Close"}
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Floating Glassmorphic Toolbar */}
        {selectedElement && (
          <div
            className="absolute z-30 bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            style={{
              top: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              maxWidth: '90vw',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            {/* Inner glow border */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none ring-1 ring-inset ring-black/[0.04]" />

            {/* Header with element type and actions */}
            <div className="flex items-center justify-between px-3 py-2 bg-black/[0.02] border-b border-black/[0.04]">
              <span className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider">
                {selectedElement.type === "text" ? (
                  <span className="flex items-center gap-1.5">
                    <TypeIcon className="h-3.5 w-3.5" />
                    Text
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5" />
                    Image
                  </span>
                )}
              </span>
              <div className="flex items-center gap-0.5">
                <button onClick={bringForward} className="p-1.5 text-neutral-500 hover:text-neutral-800 hover:bg-black/5 rounded-lg transition-all" title="Bring Forward">
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button onClick={sendBackward} className="p-1.5 text-neutral-500 hover:text-neutral-800 hover:bg-black/5 rounded-lg transition-all" title="Send Backward">
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button onClick={duplicateSelected} className="p-1.5 text-neutral-500 hover:text-neutral-800 hover:bg-black/5 rounded-lg transition-all" title="Duplicate (Cmd+D)">
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <div className="w-px h-4 bg-black/[0.06] mx-1" />
                <button onClick={deleteSelected} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all" title="Delete (Del)">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {selectedElement.type === "text" ? (
              <div className="p-3 flex items-stretch gap-3">
                {/* Font Family */}
                <div className="min-w-[120px]">
                  <select
                    value={selectedElement.fontFamily || "Outfit"}
                    onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })}
                    className="w-full bg-white/60 border border-black/[0.06] rounded-lg px-2.5 py-1.5 text-xs font-medium text-neutral-700 focus:outline-none focus:border-blue-400 transition-all"
                  >
                    {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                {/* Size */}
                <div className="w-[70px]">
                  <input
                    type="number"
                    value={selectedElement.fontSize || 48}
                    onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) || 16 })}
                    className="w-full bg-white/60 border border-black/[0.06] rounded-lg px-2.5 py-1.5 text-xs font-medium text-neutral-700 focus:outline-none focus:border-blue-400 transition-all text-center"
                    min={8}
                    max={400}
                    title="Font Size"
                  />
                </div>

                {/* Weight */}
                <div className="w-[70px]">
                  <select
                    value={selectedElement.fontWeight || "400"}
                    onChange={(e) => updateElement(selectedElement.id, { fontWeight: e.target.value })}
                    className="w-full bg-white/60 border border-black/[0.06] rounded-lg px-2.5 py-1.5 text-xs font-medium text-neutral-700 focus:outline-none focus:border-blue-400 transition-all"
                  >
                    <option value="300">Lt</option>
                    <option value="400">Rg</option>
                    <option value="700">Bd</option>
                    <option value="800">Bl</option>
                  </select>
                </div>

                {/* Color */}
                <div className="flex items-center gap-1">
                  {PRESET_COLORS.slice(0, 8).map(c => (
                    <button
                      key={c}
                      onClick={() => updateElement(selectedElement.id, { color: c })}
                      className={`w-5 h-5 rounded-full border shadow-sm transition-all ${
                        selectedElement.color === c ? "ring-2 ring-blue-500 ring-offset-2 scale-110" : "border-black/[0.08] hover:scale-110"
                      }`}
                      style={{ backgroundColor: c === "#ffffff" ? "#f3f4f6" : c }}
                    />
                  ))}
                </div>

                {/* Alignment */}
                <div className="flex items-center gap-0.5 bg-white/40 rounded-lg p-0.5 border border-black/[0.04]">
                  {(["left", "center", "right"] as const).map(align => (
                    <button
                      key={align}
                      onClick={() => updateElement(selectedElement.id, { textAlign: align })}
                      className={`p-1.5 rounded-md transition-all ${
                        selectedElement.textAlign === align
                          ? "bg-white shadow-sm text-blue-600"
                          : "text-neutral-500 hover:text-neutral-700"
                      }`}
                    >
                      {align === "left" && <AlignLeft className="h-3.5 w-3.5" />}
                      {align === "center" && <AlignCenter className="h-3.5 w-3.5" />}
                      {align === "right" && <AlignRight className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </div>

                {/* Italic */}
                <button
                  onClick={() => updateElement(selectedElement.id, {
                    fontStyle: selectedElement.fontStyle === "italic" ? "normal" : "italic"
                  })}
                  className={`p-1.5 rounded-lg border border-black/[0.04] transition-all ${
                    selectedElement.fontStyle === "italic"
                      ? "bg-white shadow-sm text-blue-600"
                      : "bg-white/40 text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  <Italic className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="p-3 flex items-stretch gap-3">
                {/* Replace Image */}
                <div className="relative">
                  <input
                    key={fileInputKey}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) {
                        alert("Image size exceeds 5MB limit.");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        updateElement(selectedElement.id, { src: ev.target?.result as string });
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="h-full flex items-center gap-2 px-3 py-1.5 bg-white/60 border border-dashed border-black/[0.1] rounded-lg text-xs font-medium text-neutral-600 hover:bg-white/80 hover:text-blue-600 transition-all cursor-pointer">
                    <ImageIcon className="h-3.5 w-3.5" />
                    Replace
                  </div>
                </div>

                {/* Border Radius */}
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-semibold text-neutral-500 whitespace-nowrap">Radius:</label>
                  <input
                    type="range" min={0} max={100}
                    value={selectedElement.borderRadius || 0}
                    onChange={(e) => updateElement(selectedElement.id, { borderRadius: parseInt(e.target.value) })}
                    className="w-20 accent-blue-600"
                  />
                  <span className="text-xs text-neutral-600 w-6">{selectedElement.borderRadius || 0}</span>
                </div>

                {/* Stroke Width */}
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-semibold text-neutral-500 whitespace-nowrap">Border:</label>
                  <input
                    type="range" min={0} max={20}
                    value={selectedElement.strokeWidth || 0}
                    onChange={(e) => updateElement(selectedElement.id, { strokeWidth: parseInt(e.target.value) })}
                    className="w-16 accent-blue-600"
                  />
                  <span className="text-xs text-neutral-600 w-6">{selectedElement.strokeWidth || 0}</span>
                </div>

                {(selectedElement.strokeWidth || 0) > 0 && (
                  <div className="flex items-center gap-1">
                    {PRESET_COLORS.slice(0, 6).map(c => (
                      <button
                        key={c}
                        onClick={() => updateElement(selectedElement.id, { strokeColor: c })}
                        className={`w-4 h-4 rounded-full border border-black/[0.08] shadow-sm transition-all ${
                          selectedElement.strokeColor === c ? "ring-2 ring-blue-500 ring-offset-1 scale-110" : ""
                        }`}
                        style={{ backgroundColor: c === "#ffffff" ? "#f3f4f6" : c }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Canvas Area */}
        <div 
          ref={containerRef} 
          className="flex-1 bg-[#F1F3F5] relative overflow-hidden flex items-center justify-center outline-none"
          tabIndex={0} // Make focusable for keyboard shortcuts
          style={{ 
            backgroundImage: "radial-gradient(#d4d4d4 1px, transparent 1px)", 
            backgroundSize: "20px 20px",
            cursor: isPanning ? 'grab' : 'default'
          }}
        >
          {renderInlineEditor()}
          
          <Stage
            ref={stageRef}
            width={stageDimensions.width}
            height={stageDimensions.height}
            scaleX={stageScale}
            scaleY={stageScale}
            x={stagePosition.x}
            y={stagePosition.y}
            onWheel={handleWheel}
            draggable={isPanning}
            onDragStart={(e) => {
              if (isPanning) e.target.getStage()?.container().classList.add('cursor-grabbing');
            }}
            onDragEnd={(e) => {
              if (isPanning) e.target.getStage()?.container().classList.remove('cursor-grabbing');
              setStagePosition({ x: e.target.x(), y: e.target.y() });
            }}
            onClick={handleStageClick}
            onTap={handleStageClick}
            onDblClick={handleDoubleClick}
            onDblTap={handleDoubleClick}
          >
            {bgImageObj && (
              <Layer listening={false}>
                <KonvaImage
                  image={bgImageObj}
                  x={0}
                  y={0}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  listening={false}
                />
              </Layer>
            )}
            <Layer>
              <Rect
                x={0}
                y={0}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                fill="#ffffff"
                shadowColor="rgba(0,0,0,0.12)"
                shadowBlur={40}
                shadowOffset={{ x: 0, y: 15 }}
                shadowOpacity={1}
                listening={false} // Don't block clicks to the stage
              />
              {elements.map(el => (
                el.type === "text" ? (
                  <TextElementComponent
                    key={el.id}
                    el={el}
                    isEditing={isTextEditing && editTextId === el.id}
                    onSelect={() => setSelectedId(el.id)}
                    onChange={(updates) => updateElement(el.id, updates)}
                  />
                ) : (
                  <ImageElementComponent
                    key={el.id}
                    el={el}
                    onSelect={() => setSelectedId(el.id)}
                    onChange={(updates) => updateElement(el.id, updates)}
                  />
                )
              ))}
              <Transformer
                ref={trRef}
                boundBoxFunc={(oldBox: { x: number; y: number; width: number; height: number; rotation: number }, newBox: { x: number; y: number; width: number; height: number; rotation: number }) => {
                  if (newBox.width < 10 || newBox.height < 10) return oldBox;
                  return newBox;
                }}
                rotateEnabled={true}
                enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right", "middle-left", "middle-right"]}
                anchorSize={10}
                anchorCornerRadius={5}
                borderStroke="#3b82f6"
                borderStrokeWidth={1.5}
                anchorStroke="#3b82f6"
                anchorStrokeWidth={1.5}
                anchorFill="#ffffff"
                padding={2}
              />
            </Layer>
          </Stage>

          {/* Bottom Right Zoom Controls */}
          <div className="absolute bottom-6 right-6 bg-white border border-neutral-200 shadow-lg rounded-xl flex items-center p-1.5 z-20">
            <button onClick={() => {
              const newScale = Math.max(0.1, stageScale - 0.1);
              setStageScale(newScale);
            }} className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg">
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-neutral-700 min-w-[50px] text-center select-none">
              {Math.round(stageScale * 100)}%
            </span>
            <button onClick={() => {
              const newScale = Math.min(5, stageScale + 0.1);
              setStageScale(newScale);
            }} className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg">
              <ZoomIn className="h-4 w-4" />
            </button>
            <div className="w-px h-5 bg-neutral-200 mx-1" />
            <button onClick={fitToScreen} className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg" title="Fit to Screen">
              <Maximize className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
