"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Stage, Layer, Rect, Text as KonvaText, Image as KonvaImage, Transformer, Group } from "react-konva";
import { X, Trash2, ImageIcon, TypeIcon, AlignLeft, AlignCenter, AlignRight, Bold, Italic } from "lucide-react";

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

function ImageElementComponent({ el, onSelect, onChange }: {
  el: CanvasElement;
  onSelect: () => void;
  onChange: (updates: Partial<CanvasElement>) => void;
}) {
  const shapeRef = useRef<any>(null);
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

function TextElementComponent({ el, onSelect, onChange }: {
  el: CanvasElement;
  onSelect: () => void;
  onChange: (updates: Partial<CanvasElement>) => void;
}) {
  const shapeRef = useRef<any>(null);

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
    />
  );
}

export default function CanvasEditor({ initialElements, onSave, onClose }: CanvasEditorProps) {
  const [elements, setElements] = useState<CanvasElement[]>(initialElements);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const stageRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageScale, setStageScale] = useState(0.5);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [fileInputKey, setFileInputKey] = useState(0);
  const [isTextEditing, setIsTextEditing] = useState(false);
  const [editTextValue, setEditTextValue] = useState("");
  const [editTextId, setEditTextId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedElement = elements.find(el => el.id === selectedId);

  // Fit stage to container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth;
        const h = containerRef.current.offsetHeight;
        const scale = Math.min(w / CANVAS_WIDTH, h / CANVAS_HEIGHT) * 0.92;
        setStageScale(scale);
        setStagePosition({
          x: (w - CANVAS_WIDTH * scale) / 2,
          y: (h - CANVAS_HEIGHT * scale) / 2,
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

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

  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  }, []);

  const deleteSelected = useCallback(() => {
    if (selectedId) {
      setElements(prev => prev.filter(el => el.id !== selectedId));
      setSelectedId(null);
    }
  }, [selectedId]);

  const handleStageClick = useCallback((e: any) => {
    if (e.target === e.target.getStage()) {
      setSelectedId(null);
      if (isTextEditing) {
        setIsTextEditing(false);
        setEditTextId(null);
      }
    }
  }, [isTextEditing]);

  const handleDoubleClick = useCallback((e: any) => {
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
    }
  }, [elements]);

  const commitTextEdit = useCallback(() => {
    if (editTextId !== null) {
      updateElement(editTextId, { content: editTextValue });
    }
    setIsTextEditing(false);
    setEditTextId(null);
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
    setElements(prev => [...prev, newEl]);
    setSelectedId(newEl.id);
  }, []);

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
        setElements(prev => [...prev, newEl]);
        setSelectedId(newEl.id);
      };
      reader.readAsDataURL(file);
    };
    input.click();
    setFileInputKey(k => k + 1);
  }, []);

  const handleSave = useCallback(async () => {
    if (!stageRef.current) return;
    setIsSaving(true);
    try {
      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
      onSave(elements, dataUrl);
    } catch (err) {
      console.error("Failed to export canvas:", err);
    } finally {
      setIsSaving(false);
    }
  }, [elements, onSave]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-neutral-200 shrink-0">
        <h2 className="text-lg font-extrabold text-neutral-900">Slide Canvas Editor</h2>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-neutral-400">{CANVAS_WIDTH} × {CANVAS_HEIGHT} · 4:5</span>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all text-sm disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save & Close"}
          </button>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Property Panel */}
        <div className="w-[280px] bg-white border-r border-neutral-200 overflow-y-auto p-5 shrink-0">
          {selectedElement ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  {selectedElement.type === "text" ? "Text Element" : "Image Element"}
                </span>
                <button
                  onClick={deleteSelected}
                  className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {selectedElement.type === "text" ? (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Content</label>
                    <textarea
                      value={selectedElement.content || ""}
                      onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                      className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-800 focus:outline-none focus:border-blue-400 font-medium resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase">Font</label>
                      <select
                        value={selectedElement.fontFamily || "Outfit"}
                        onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })}
                        className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-800 focus:outline-none"
                      >
                        {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase">Size</label>
                      <input
                        type="number"
                        value={selectedElement.fontSize || 48}
                        onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) || 16 })}
                        className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-800 focus:outline-none text-center"
                        min={8}
                        max={200}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase">Weight</label>
                      <select
                        value={selectedElement.fontWeight || "400"}
                        onChange={(e) => updateElement(selectedElement.id, { fontWeight: e.target.value })}
                        className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-800 focus:outline-none"
                      >
                        <option value="300">Light (300)</option>
                        <option value="400">Regular (400)</option>
                        <option value="700">Bold (700)</option>
                        <option value="800">Extra Bold (800)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase">Style</label>
                      <div className="flex gap-1">
                        <button
                          onClick={() => updateElement(selectedElement.id, {
                            fontStyle: selectedElement.fontStyle === "italic" ? "normal" : "italic"
                          })}
                          className={`p-2 rounded-lg border text-xs transition-all ${
                            selectedElement.fontStyle === "italic"
                              ? "bg-blue-50 border-blue-200 text-blue-700"
                              : "bg-white border-neutral-200 text-neutral-500 hover:text-neutral-700"
                          }`}
                        >
                          <Italic className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Color</label>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => updateElement(selectedElement.id, { color: c })}
                          className={`w-6 h-6 rounded-full border-2 transition-all ${
                            selectedElement.color === c ? "border-neutral-900 scale-110" : "border-neutral-200"
                          }`}
                          style={{ backgroundColor: c === "#ffffff" ? "#f3f4f6" : c }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Alignment</label>
                    <div className="flex gap-1">
                      {(["left", "center", "right"] as const).map(align => (
                        <button
                          key={align}
                          onClick={() => updateElement(selectedElement.id, { textAlign: align })}
                          className={`p-2 rounded-lg border text-xs transition-all flex items-center gap-1 ${
                            selectedElement.textAlign === align
                              ? "bg-blue-50 border-blue-200 text-blue-700"
                              : "bg-white border-neutral-200 text-neutral-500 hover:text-neutral-700"
                          }`}
                        >
                          {align === "left" && <AlignLeft className="h-3.5 w-3.5" />}
                          {align === "center" && <AlignCenter className="h-3.5 w-3.5" />}
                          {align === "right" && <AlignRight className="h-3.5 w-3.5" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">Image</label>
                    <div className="relative border-2 border-dashed border-neutral-200 bg-neutral-50 hover:bg-neutral-100 rounded-lg p-4 flex flex-col items-center text-center">
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
                      <ImageIcon className="h-5 w-5 text-neutral-400 mb-1" />
                      <span className="text-xs font-bold text-neutral-500">Replace Image</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">
                      Border Radius: {selectedElement.borderRadius || 0}px
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={selectedElement.borderRadius || 0}
                      onChange={(e) => updateElement(selectedElement.id, { borderRadius: parseInt(e.target.value) })}
                      className="w-full accent-blue-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase">
                      Stroke Width: {selectedElement.strokeWidth || 0}px
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={20}
                      value={selectedElement.strokeWidth || 0}
                      onChange={(e) => updateElement(selectedElement.id, { strokeWidth: parseInt(e.target.value) })}
                      className="w-full accent-blue-600"
                    />
                    {(selectedElement.strokeWidth || 0) > 0 && (
                      <div className="mt-2">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">Stroke Color</label>
                        <div className="flex flex-wrap gap-1.5">
                          {PRESET_COLORS.map(c => (
                            <button
                              key={c}
                              onClick={() => updateElement(selectedElement.id, { strokeColor: c })}
                              className={`w-5 h-5 rounded-full border-2 transition-all ${
                                selectedElement.strokeColor === c ? "border-neutral-900 scale-110" : "border-neutral-200"
                              }`}
                              style={{ backgroundColor: c === "#ffffff" ? "#f3f4f6" : c }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-neutral-400 font-medium">
                Select an element on the canvas or add a new one:
              </p>
              <button
                onClick={addTextElement}
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 hover:border-blue-300 hover:bg-blue-50 text-neutral-700 hover:text-blue-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
              >
                <TypeIcon className="h-4 w-4" /> Add Text
              </button>
              <button
                onClick={addImageElement}
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 hover:border-blue-300 hover:bg-blue-50 text-neutral-700 hover:text-blue-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
              >
                <ImageIcon className="h-4 w-4" /> Add Image
              </button>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div ref={containerRef} className="flex-1 bg-neutral-800 overflow-hidden relative">
          {/* Inline text editor overlay */}
          {isTextEditing && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white border border-neutral-200 rounded-xl shadow-2xl p-4 w-[500px]">
              <textarea
                value={editTextValue}
                onChange={(e) => setEditTextValue(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-800 focus:outline-none resize-none"
                rows={4}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    commitTextEdit();
                  }
                  if (e.key === "Escape") {
                    setIsTextEditing(false);
                    setEditTextId(null);
                  }
                }}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-[10px] text-neutral-400">⌘+Enter to save · Esc to cancel</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setIsTextEditing(false); setEditTextId(null); }}
                    className="px-3 py-1.5 text-xs font-bold text-neutral-600 hover:text-neutral-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={commitTextEdit}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}

          <Stage
            ref={stageRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            scaleX={stageScale}
            scaleY={stageScale}
            x={stagePosition.x}
            y={stagePosition.y}
            onClick={handleStageClick}
            onTap={handleStageClick}
            onDblClick={handleDoubleClick}
            onDblTap={handleDoubleClick}
          >
            <Layer>
              <Rect
                x={0}
                y={0}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                fill="#ffffff"
                shadowColor="rgba(0,0,0,0.15)"
                shadowBlur={30}
                shadowOffset={{ x: 0, y: 4 }}
              />
              {elements.map(el => (
                el.type === "text" ? (
                  <TextElementComponent
                    key={el.id}
                    el={el}
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
                boundBoxFunc={(oldBox: any, newBox: any) => {
                  if (newBox.width < 10 || newBox.height < 10) return oldBox;
                  return newBox;
                }}
                rotateEnabled={true}
                enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
              />
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
}
