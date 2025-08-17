import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { Annotation, DrawingTool } from '../types';

interface DrawingContextValue {
  annotations: Annotation[];
  addAnnotation: (ann: Annotation) => void;
  updateAnnotation: (id: string, patch: Partial<Annotation>) => void;
  removeAnnotation: (id: string) => void;
  clearAnnotations: () => void;
  activeTool: DrawingTool | null;
  setActiveTool: (tool: DrawingTool | null) => void;
  drawColor: string;
  setDrawColor: (c: string) => void;
  drawLineWidth: number;
  setDrawLineWidth: (w: number) => void;
  drawFilled: boolean;
  setDrawFilled: (f: boolean) => void;
  drawStrokeStyle: 'solid' | 'dashed' | 'dotted';
  setDrawStrokeStyle: (s: 'solid'|'dashed'|'dotted') => void;
}

const DrawingContext = createContext<DrawingContextValue | undefined>(undefined);

export const DrawingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeTool, setActiveTool] = useState<DrawingTool | null>(null);
  const [drawColor, setDrawColor] = useState<string>('#f59e0b');
  const [drawLineWidth, setDrawLineWidth] = useState<number>(2);
  const [drawFilled, setDrawFilled] = useState<boolean>(false);
  const [drawStrokeStyle, setDrawStrokeStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid');

  const addAnnotation = useCallback((ann: Annotation) => setAnnotations(prev => [...prev, ann]), []);
  const updateAnnotation = useCallback((id: string, patch: Partial<Annotation>) => setAnnotations(prev => prev.map(a => a.id === id ? ({ ...a, ...patch } as Annotation) : a)), []);
  const removeAnnotation = useCallback((id: string) => setAnnotations(prev => prev.filter(a => a.id !== id)), []);
  const clearAnnotations = useCallback(() => setAnnotations([]), []);

  const value = useMemo<DrawingContextValue>(() => ({
    annotations,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    clearAnnotations,
    activeTool,
    setActiveTool,
    drawColor,
    setDrawColor,
    drawLineWidth,
    setDrawLineWidth,
    drawFilled,
    setDrawFilled,
    drawStrokeStyle,
    setDrawStrokeStyle,
  }), [annotations, addAnnotation, updateAnnotation, removeAnnotation, clearAnnotations, activeTool, drawColor, drawLineWidth, drawFilled, drawStrokeStyle]);

  return (
    <DrawingContext.Provider value={value}>{children}</DrawingContext.Provider>
  );
};

export const useDrawing = (): DrawingContextValue => {
  const ctx = useContext(DrawingContext);
  if (!ctx) throw new Error('useDrawing must be used within a DrawingProvider');
  return ctx;
};
