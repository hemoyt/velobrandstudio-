'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { editImageAction } from '@/lib/ai-client';

interface ImageEditorProps {
  projectId: string;
  initialImage: string;
  assetType?: string;
  overlayImage?: string; // The logo to place on top
  onClose: () => void;
  onSave: (newImage: string) => void;
}

interface OverlayState {
  x: number;
  y: number;
  width: number;
  height: number;
  isVisible: boolean;
  isDragging: boolean;
  isResizing: boolean;
}

interface ViewState {
  scale: number;
  x: number;
  y: number;
}

interface TextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: string;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ projectId, initialImage, assetType, overlayImage, onClose, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [baseImageObj, setBaseImageObj] = useState<HTMLImageElement | null>(null);
  const [overlayImageObj, setOverlayImageObj] = useState<HTMLImageElement | null>(null);
  
  // Canvas State
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<string[]>([initialImage]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // View State (Zoom/Pan)
  const [view, setView] = useState<ViewState>({ scale: 1, x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Overlay State (The Logo)
  const [overlay, setOverlay] = useState<OverlayState>({
    x: 50, y: 50, width: 200, height: 200, isVisible: false, isDragging: false, isResizing: false
  });
  const [isOverlayInitialized, setIsOverlayInitialized] = useState(false);

  // Text State
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  // activeLayerId can be 'logo' or a text layer ID
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);

  const QUICK_PRESETS = [
    { label: 'Grunge Texture', prompt: 'Add a subtle grunge texture overlay to give it a more worn, authentic feel.' },
    { label: 'Vintage Film', prompt: 'Apply a vintage film photography aesthetic with warm tones and soft grain.' },
    { label: 'Neon Glow', prompt: 'Add a futuristic cyberpunk neon glow effect to the edges.' },
    { label: 'Pencil Sketch', prompt: 'Convert this image into a detailed graphite pencil sketch.' },
    { label: 'Minimalist B&W', prompt: 'Convert to a high-contrast minimalist black and white style.' },
  ];

  // Global Key Listeners for Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setIsSpacePressed(true);
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && activeLayerId && activeLayerId !== 'logo' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        handleDeleteText(activeLayerId);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setIsSpacePressed(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeLayerId]);

  // 1. Load Base Image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = history[historyIndex];
    img.onload = () => {
      setBaseImageObj(img);
      if (canvasRef.current) {
        canvasRef.current.width = img.naturalWidth;
        canvasRef.current.height = img.naturalHeight;
        
        // Auto-fit view on first load
        if (containerRef.current && historyIndex === 0) {
           const containerW = containerRef.current.clientWidth;
           const containerH = containerRef.current.clientHeight;
           const scale = Math.min(
             (containerW - 80) / img.naturalWidth,
             (containerH - 80) / img.naturalHeight
           );
           setView({ scale: Math.min(scale, 1), x: 0, y: 0 });
        }
      }
    };
  }, [history, historyIndex]);

  // 2. Load Overlay Image (Logo)
  useEffect(() => {
    if (overlayImage) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = overlayImage;
      img.onload = () => {
        setOverlayImageObj(img);
      };
    } else {
        setOverlayImageObj(null);
        setOverlay(prev => ({ ...prev, isVisible: false }));
    }
  }, [overlayImage]);

  // 3. Initialize Overlay Position and Text for Social Templates
  useEffect(() => {
      if (baseImageObj) {
          // Initialize Logo if not already done
          if (overlayImageObj && !isOverlayInitialized) {
              const size = baseImageObj.naturalWidth * 0.25;
              const aspectRatio = overlayImageObj.naturalHeight / overlayImageObj.naturalWidth;
              const h = size * aspectRatio;

              setOverlay(prev => ({
                  ...prev,
                  width: size,
                  height: h,
                  x: (baseImageObj.naturalWidth - size) / 2,
                  y: (baseImageObj.naturalHeight - h) / 2,
                  isVisible: true
              }));
              setIsOverlayInitialized(true);
              if (assetType !== 'social_template') {
                 setActiveLayerId('logo');
              }
          }

          // Initialize Social Template Text
          if (assetType === 'social_template' && textLayers.length === 0) {
             const newId = `text-header-${Date.now()}`;
             const newText: TextLayer = {
                id: newId,
                text: 'Your Headline Here',
                x: baseImageObj.naturalWidth / 2 - 200,
                y: baseImageObj.naturalHeight / 2 - 24,
                fontSize: 48,
                fontFamily: 'Playfair Display',
                color: '#000000',
                fontWeight: 'bold'
             };
             setTextLayers([newText]);
             setActiveLayerId(newId);
          }
      }
  }, [baseImageObj, overlayImageObj, isOverlayInitialized, assetType]);

  // 4. Draw Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImageObj) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Base
    ctx.drawImage(baseImageObj, 0, 0, canvas.width, canvas.height);

    // Draw Overlay (Logo)
    if (overlayImageObj && overlay.isVisible) {
      ctx.drawImage(overlayImageObj, overlay.x, overlay.y, overlay.width, overlay.height);

      // Selection Box for Logo
      if (activeLayerId === 'logo') {
        ctx.strokeStyle = '#6366f1'; 
        ctx.lineWidth = 2 * (1/view.scale); 
        ctx.strokeRect(overlay.x, overlay.y, overlay.width, overlay.height);

        // Resize Handle
        ctx.fillStyle = '#6366f1';
        const handleSize = 12 * (1/view.scale);
        ctx.fillRect(overlay.x + overlay.width - (handleSize/2), overlay.y + overlay.height - (handleSize/2), handleSize, handleSize);
      }
    }

    // Draw Text Layers
    textLayers.forEach(layer => {
      ctx.font = `${layer.fontWeight} ${layer.fontSize}px ${layer.fontFamily}`;
      ctx.fillStyle = layer.color;
      ctx.textBaseline = 'top';
      ctx.fillText(layer.text, layer.x, layer.y);

      // Selection Box for Text
      if (activeLayerId === layer.id) {
        const metrics = ctx.measureText(layer.text);
        const width = metrics.width;
        const height = layer.fontSize; // Approx height
        const padding = 4 * (1/view.scale);
        
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2 * (1/view.scale);
        ctx.strokeRect(layer.x - padding, layer.y - padding, width + (padding*2), height + (padding*2));
      }
    });

  }, [baseImageObj, overlayImageObj, overlay, view.scale, textLayers, activeLayerId]);

  // --- Interaction Handlers ---

  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    // 1. Pan Mode Check
    if (isSpacePressed) {
       setIsPanning(true);
       setPanStart({ x: clientX, y: clientY });
       return;
    }

    const { x, y } = getCanvasCoords(clientX, clientY);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    // 2. Check Text Layer Hits (Top to Bottom visual order -> Reverse array check)
    let hitTextId = null;
    // We iterate backwards to catch the topmost layer first
    for (let i = textLayers.length - 1; i >= 0; i--) {
      const layer = textLayers[i];
      if (ctx) {
        ctx.font = `${layer.fontWeight} ${layer.fontSize}px ${layer.fontFamily}`;
        const metrics = ctx.measureText(layer.text);
        const w = metrics.width;
        const h = layer.fontSize; // Approx
        if (x >= layer.x && x <= layer.x + w && y >= layer.y && y <= layer.y + h) {
          hitTextId = layer.id;
          break; 
        }
      }
    }

    if (hitTextId) {
      setActiveLayerId(hitTextId);
      setOverlay(prev => ({ ...prev, isDragging: true })); // Treat text dragging same as overlay for interaction start
      return;
    }

    // 3. Check Logo Overlay Hits
    if (overlay.isVisible) {
      const handleSize = 20 * (1/view.scale); 
      // Resize Handle
      if (
        x >= overlay.x + overlay.width - handleSize &&
        x <= overlay.x + overlay.width + handleSize &&
        y >= overlay.y + overlay.height - handleSize &&
        y <= overlay.y + overlay.height + handleSize
      ) {
        setActiveLayerId('logo');
        setOverlay(prev => ({ ...prev, isResizing: true }));
        return;
      }
      // Drag Body
      if (
        x >= overlay.x &&
        x <= overlay.x + overlay.width &&
        y >= overlay.y &&
        y <= overlay.y + overlay.height
      ) {
        setActiveLayerId('logo');
        setOverlay(prev => ({ ...prev, isDragging: true }));
        return;
      }
    }

    // 4. Background Pan
    setActiveLayerId(null); // Clicked empty space
    setIsPanning(true);
    setPanStart({ x: clientX, y: clientY });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    if (isPanning) {
      const dx = clientX - panStart.x;
      const dy = clientY - panStart.y;
      setView(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      setPanStart({ x: clientX, y: clientY });
      return;
    }

    const { x, y } = getCanvasCoords(clientX, clientY);

    // Handle Active Item Dragging
    if (overlay.isDragging) {
      if (activeLayerId === 'logo') {
        setOverlay(prev => ({
          ...prev,
          x: x - prev.width / 2,
          y: y - prev.height / 2
        }));
      } else if (activeLayerId) {
        // Dragging Text
        setTextLayers(prev => prev.map(l => {
          if (l.id === activeLayerId) {
            // Center the text on mouse roughly
            // Need measure to be precise, but simple offset is okay
            return { ...l, x: x - 20, y: y - 10 }; 
          }
          return l;
        }));
      }
    } else if (overlay.isResizing && activeLayerId === 'logo') {
       // Lock aspect ratio for logo
       const originalRatio = overlayImageObj ? overlayImageObj.naturalWidth / overlayImageObj.naturalHeight : 1;
       const newWidth = Math.max(50, x - overlay.x);
       setOverlay(prev => ({
        ...prev,
        width: newWidth,
        height: newWidth / originalRatio
      }));
    }
  };

  const handleMouseUp = () => {
    setOverlay(prev => ({ ...prev, isDragging: false, isResizing: false }));
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = -Math.sign(e.deltaY) * 0.1;
    const newScale = Math.max(0.1, Math.min(5, view.scale + delta));
    setView(prev => ({ ...prev, scale: newScale }));
  };

  // --- View Controls ---
  const zoomIn = () => setView(prev => ({ ...prev, scale: Math.min(5, prev.scale + 0.1) }));
  const zoomOut = () => setView(prev => ({ ...prev, scale: Math.max(0.1, prev.scale - 0.1) }));
  const fitToScreen = () => {
      if (baseImageObj && containerRef.current) {
        const containerW = containerRef.current.clientWidth;
        const containerH = containerRef.current.clientHeight;
        const scale = Math.min(
            (containerW - 80) / baseImageObj.naturalWidth,
            (containerH - 80) / baseImageObj.naturalHeight
        );
        setView({ scale: Math.min(scale, 1), x: 0, y: 0 });
      }
  };

  // --- Actions ---

  const handleAddText = () => {
    if (!baseImageObj) return;
    const newId = `text-${Date.now()}`;
    const newText: TextLayer = {
      id: newId,
      text: 'Double Click to Edit',
      x: baseImageObj.naturalWidth / 2 - 100,
      y: baseImageObj.naturalHeight / 2,
      fontSize: 48,
      fontFamily: 'Inter',
      color: '#000000',
      fontWeight: 'bold'
    };
    setTextLayers(prev => [...prev, newText]);
    setActiveLayerId(newId);
  };

  const updateActiveText = (key: keyof TextLayer, value: any) => {
    if (!activeLayerId || activeLayerId === 'logo') return;
    setTextLayers(prev => prev.map(l => l.id === activeLayerId ? { ...l, [key]: value } : l));
  };

  const handleDeleteText = (id: string) => {
    setTextLayers(prev => prev.filter(l => l.id !== id));
    if (activeLayerId === id) setActiveLayerId(null);
  };

  const activeTextLayer = textLayers.find(l => l.id === activeLayerId);

  const handleSmartErase = async () => {
    if (!baseImageObj) return;
    setIsProcessing(true);
    try {
        const cleanPrompt = "Remove all logos, branding, text, and graphics from the objects in this image. Keep the lighting, textures, and background exactly the same. Make the surfaces blank.";
        // We edit the base image (which is history[historyIndex])
        const currentBase = history[historyIndex];
        const newBase = await editImageAction(projectId, currentBase, cleanPrompt);
        
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newBase);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        
        // Ensure overlay is visible so user can place it
        if (overlayImageObj) {
            setOverlay(prev => ({ ...prev, isVisible: true }));
            setActiveLayerId('logo');
        }
    } catch (e) {
        console.error(e);
        alert("Failed to clean background.");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleEdit = async () => {
    if (!prompt.trim() || !canvasRef.current) return;
    setIsProcessing(true);
    // This captures the whole scene (including overlays) and sends to AI
    const currentDataUrl = canvasRef.current.toDataURL('image/png');
    try {
      const newImage = await editImageAction(projectId, currentDataUrl, prompt);
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newImage);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setPrompt('');
      
      // Since the new image likely contains the baked effects of overlays, we hide the dynamic overlays
      // effectively "flattening" the image
      setOverlay(prev => ({ ...prev, isVisible: false }));
      setIsOverlayInitialized(false);
      setTextLayers([]); 
    } catch (e) {
      console.error(e);
      alert("Failed to edit image.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
    }
  };

  const handleCompositeSave = () => {
    if (canvasRef.current) {
      onSave(canvasRef.current.toDataURL('image/png'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-7xl h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl relative">
        
        {/* Canvas Area Container */}
        <div 
           ref={containerRef}
           className="flex-1 bg-stone-100 relative overflow-hidden flex items-center justify-center cursor-default group"
           style={{ cursor: isSpacePressed || isPanning ? 'grab' : 'default' }}
           onWheel={handleWheel}
           onMouseDown={handleMouseDown}
           onMouseMove={handleMouseMove}
           onMouseUp={handleMouseUp}
           onMouseLeave={handleMouseUp}
           onTouchStart={handleMouseDown}
           onTouchMove={handleMouseMove}
           onTouchEnd={handleMouseUp}
        >
           {/* Grid Pattern */}
           <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

           <div 
             className="shadow-2xl transition-transform duration-75 ease-out origin-center"
             style={{ 
               transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` 
             }}
           >
              <canvas
                ref={canvasRef}
                className="block max-w-none" 
              />
           </div>

           {/* Floating Toolbar */}
           <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-stone-200 rounded-full px-4 py-2 flex items-center gap-2 z-20">
               <button onClick={zoomOut} className="w-8 h-8 flex items-center justify-center text-stone-600 hover:bg-stone-100 rounded-full transition-colors" title="Zoom Out">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
               </button>
               <span className="text-xs font-mono font-medium text-stone-500 w-12 text-center">{Math.round(view.scale * 100)}%</span>
               <button onClick={zoomIn} className="w-8 h-8 flex items-center justify-center text-stone-600 hover:bg-stone-100 rounded-full transition-colors" title="Zoom In">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
               </button>
               <div className="w-px h-4 bg-stone-300 mx-2"></div>
               <button onClick={fitToScreen} className="px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-full transition-colors whitespace-nowrap">
                  Fit Screen
               </button>
               <div className="w-px h-4 bg-stone-300 mx-2"></div>
               <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${isSpacePressed ? 'text-indigo-600' : 'text-stone-400'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"></path></svg>
                  {isSpacePressed ? 'Pan Mode' : 'Hold Space'}
               </div>
           </div>
        </div>

        {/* Controls Sidebar */}
        <div className="w-full md:w-80 bg-white border-l border-stone-200 flex flex-col z-10 relative shadow-[-10px_0_30px_rgba(0,0,0,0.02)]">
          
          <div className="p-6 border-b border-stone-100 flex justify-between items-center">
             <h3 className="text-xl font-bold text-stone-800 font-serif">Studio Editor</h3>
             <button onClick={onClose} className="text-stone-400 hover:text-stone-900">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
             </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Smart Tools Section */}
            {overlayImage && (
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-6">
                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wide mb-2">Smart Tools</h4>
                <button 
                    onClick={handleSmartErase}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 bg-white border border-indigo-200 text-indigo-700 py-2 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors shadow-sm"
                >
                    {isProcessing ? 'Cleaning...' : '✨ Erase Baked Logo'}
                </button>
                <p className="text-[10px] text-indigo-400 mt-2 leading-tight">
                    Remove the AI-generated logo from the mockup so you can manually reposition your logo overlay.
                </p>
                </div>
            )}

            {/* 1. Layers Section */}
            <div>
               <div className="flex justify-between items-center mb-3">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Layers</label>
                  <button 
                    onClick={handleAddText}
                    className="text-xs flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-800"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    Add Text
                  </button>
               </div>
               
               <div className="space-y-2">
                  {/* Logo Layer Item */}
                  {overlayImage && (
                    <div 
                      onClick={() => setActiveLayerId('logo')}
                      className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${activeLayerId === 'logo' ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' : 'bg-white border-stone-200 hover:bg-stone-50'}`}
                    >
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-white border border-stone-200 p-1">
                             <img src={overlayImage} className="w-full h-full object-contain" alt="layer" />
                          </div>
                          <span className="text-sm font-medium text-stone-700">Logo Overlay</span>
                       </div>
                       <button 
                         onClick={(e) => { e.stopPropagation(); setOverlay(prev => ({...prev, isVisible: !prev.isVisible})); }}
                         className={`w-4 h-4 rounded-full border ${overlay.isVisible ? 'bg-stone-900 border-stone-900' : 'bg-white border-stone-300'}`}
                         title="Toggle Visibility"
                       />
                    </div>
                  )}

                  {/* Text Layer Items */}
                  {textLayers.map((layer) => (
                    <div 
                      key={layer.id}
                      onClick={() => setActiveLayerId(layer.id)}
                      className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${activeLayerId === layer.id ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' : 'bg-white border-stone-200 hover:bg-stone-50'}`}
                    >
                       <div className="flex items-center gap-3 overflow-hidden">
                          <span className="text-lg leading-none">T</span>
                          <span className="text-sm font-medium text-stone-700 truncate">{layer.text}</span>
                       </div>
                       <button 
                         onClick={(e) => { e.stopPropagation(); handleDeleteText(layer.id); }}
                         className="text-stone-400 hover:text-red-500"
                         title="Delete Layer"
                       >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                       </button>
                    </div>
                  ))}
               </div>
            </div>
            
            <hr className="border-stone-100" />

            {/* 2. Properties Panel (Context Aware) */}
            {activeTextLayer && activeLayerId !== 'logo' ? (
               <div className="animate-fade-in space-y-4">
                  <div className="flex justify-between items-center">
                     <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Text Properties</label>
                  </div>
                  
                  <div>
                    <input 
                      type="text" 
                      value={activeTextLayer.text}
                      onChange={(e) => updateActiveText('text', e.target.value)}
                      className="w-full p-2 bg-stone-50 border border-stone-200 rounded-md text-sm font-medium focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                     <div>
                       <label className="block text-[10px] text-stone-500 uppercase mb-1">Font</label>
                       <select 
                         value={activeTextLayer.fontFamily}
                         onChange={(e) => updateActiveText('fontFamily', e.target.value)}
                         className="w-full p-2 bg-stone-50 border border-stone-200 rounded-md text-xs"
                       >
                         <option value="Inter">Sans Serif</option>
                         <option value="Playfair Display">Serif</option>
                         <option value="monospace">Monospace</option>
                       </select>
                     </div>
                     <div>
                       <label className="block text-[10px] text-stone-500 uppercase mb-1">Color</label>
                       <div className="flex items-center gap-2">
                         <input 
                           type="color" 
                           value={activeTextLayer.color}
                           onChange={(e) => updateActiveText('color', e.target.value)}
                           className="h-8 w-8 rounded overflow-hidden cursor-pointer border border-stone-200"
                         />
                         <span className="text-xs text-stone-500 font-mono">{activeTextLayer.color}</span>
                       </div>
                     </div>
                  </div>

                  <div>
                     <label className="block text-[10px] text-stone-500 uppercase mb-1">Size: {activeTextLayer.fontSize}px</label>
                     <input 
                        type="range" 
                        min="12" 
                        max="200" 
                        value={activeTextLayer.fontSize}
                        onChange={(e) => updateActiveText('fontSize', parseInt(e.target.value))}
                        className="w-full accent-stone-900"
                     />
                  </div>
               </div>
            ) : (
               /* Default: AI Magic Edit */
               <div className="animate-fade-in">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-3">Magic Edit</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe changes (e.g., 'Add a cinematic lens flare', 'Make it black and white')..."
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-1 focus:ring-stone-400 focus:border-stone-400 transition-all h-24 resize-none text-sm mb-4 font-sans placeholder-stone-400"
                  />
                  <div className="flex flex-wrap gap-2 mb-4">
                    {QUICK_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => setPrompt(preset.prompt)}
                        className="px-3 py-1.5 bg-white border border-stone-200 hover:border-stone-900 hover:bg-stone-900 hover:text-white text-stone-600 rounded-full text-xs transition-all shadow-sm"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <Button 
                    onClick={handleEdit} 
                    disabled={!prompt.trim()} 
                    isLoading={isProcessing}
                    className="w-full"
                    size="sm"
                  >
                    Generate with AI
                  </Button>
                  <p className="text-[10px] text-stone-400 mt-2 text-center">Note: AI generation will flatten layers.</p>
               </div>
            )}
          </div>

          <div className="p-6 border-t border-stone-100 bg-stone-50/50">
             <div className="flex gap-3">
               <Button variant="outline" onClick={handleUndo} disabled={historyIndex === 0} className="flex-1 bg-white">
                 Undo
               </Button>
               <Button variant="primary" onClick={handleCompositeSave} className="flex-1">
                 Save
               </Button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};