import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { toPng, toCanvas } from 'html-to-image';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import * as MP4Muxer from 'mp4-muxer';
import { Download, Monitor, Type, Sliders, Palette, LayoutTemplate, Activity, FileVideo, Baseline, Sun, MonitorUp } from 'lucide-react';

export default function App() {
  const [text, setText] = useState('HELLO\\nWORLD');
  const [color, setColor] = useState('#ffffff');
  const [effectColor, setEffectColor] = useState('#00ffcc');
  const [glowIntensity, setGlowIntensity] = useState(30);
  const [animation, setAnimation] = useState<'none' | 'blink' | 'marquee' | 'typewriter' | 'pulse' | 'bounce' | 'glitch' | 'scroll-y'>('none');
  const [animationSpeed, setAnimationSpeed] = useState(50);
  const [blinkSpeed, setBlinkSpeed] = useState(50);
  const [fontFamily, setFontFamily] = useState('font-vt323');
  const [textSize, setTextSize] = useState(100);
  const [effectStyle, setEffectStyle] = useState<'solid' | 'circular' | 'rectangular' | 'starburst' | 'outline'>('circular');
  const [screenSize, setScreenSize] = useState('auto');
  const [isRainbow, setIsRainbow] = useState(false);
  const [isEffectRainbow, setIsEffectRainbow] = useState(false);
  const [rainbowSpeed, setRainbowSpeed] = useState(50);
  const [hueRotate, setHueRotate] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportFormat, setExportFormat] = useState<'png' | 'gif' | 'mp4'>('png');
  const [displayedText, setDisplayedText] = useState(text);

  const previewWrapperRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const textWrapperRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const PRESET_COLORS = [
    '#ff0000',
    '#00ff00',
    '#4444ff',
    '#ffff00',
    '#ff00ff',
    '#00ffcc',
    '#ffffff',
  ];

  const ANIMATION_OPTIONS = [
    { id: 'none', label: 'None' },
    { id: 'blink', label: 'Blink' },
    { id: 'marquee', label: 'Marquee' },
    { id: 'typewriter', label: 'Typewriter' },
    { id: 'pulse', label: 'Pulse' },
    { id: 'bounce', label: 'Bounce' },
    { id: 'glitch', label: 'Glitch' },
    { id: 'scroll-y', label: 'Scroll Y' },
  ] as const;

  const FONT_OPTIONS = [
    { id: 'font-vt323', label: 'VT323 (LED Matrix)' },
    { id: 'font-dotgothic', label: 'DotGothic16 (Dot Matrix)' },
    { id: 'font-sharetech', label: 'Share Tech Mono (Digital)' },
    { id: 'font-orbitron', label: 'Orbitron (Sci-Fi)' },
    { id: 'font-pressstart', label: 'Press Start (Retro)' },
  ] as const;

  const EFFECT_STYLE_OPTIONS = [
    { id: 'solid', label: 'Solid Color' },
    { id: 'circular', label: 'Circular' },
    { id: 'rectangular', label: 'Rectangular' },
    { id: 'starburst', label: 'Starburst' },
    { id: 'outline', label: 'Outline' },
  ] as const;

  const SCREEN_SIZE_OPTIONS = [
    { id: 'auto', label: 'Auto (Responsive)' },
    { id: '1920x1080', label: '1920x1080 (FHD Landscape)' },
    { id: '1080x1920', label: '1080x1920 (FHD Portrait)' },
    { id: '1080x1080', label: '1080x1080 (Square)' },
    { id: '2560x1080', label: '2560x1080 (Ultrawide)' },
  ] as const;

  const getEffectShadow = (c: string, g: number) => {
    if (g === 0) return 'none';
    switch (effectStyle) {
      case 'solid':
        return 'none';
      case 'outline':
        const o = Math.max(1, g * 0.1);
        return `
          -${o}px -${o}px 0 ${c},
          ${o}px -${o}px 0 ${c},
          -${o}px ${o}px 0 ${c},
          ${o}px ${o}px 0 ${c},
          0 0 ${g * 0.5}px ${c}
        `;
      case 'rectangular':
        return `
          0 0 ${g * 0.1}px ${c},
          ${g * 0.4}px 0 ${g * 0.4}px ${c},
          -${g * 0.4}px 0 ${g * 0.4}px ${c},
          0 ${g * 0.4}px ${g * 0.4}px ${c},
          0 -${g * 0.4}px ${g * 0.4}px ${c},
          ${g * 0.4}px ${g * 0.4}px ${g * 0.4}px ${c},
          -${g * 0.4}px -${g * 0.4}px ${g * 0.4}px ${c},
          ${g * 0.4}px -${g * 0.4}px ${g * 0.4}px ${c},
          -${g * 0.4}px ${g * 0.4}px ${g * 0.4}px ${c}
        `;
      case 'starburst':
        return `
          0 0 ${g * 0.1}px ${c},
          ${g * 0.8}px ${g * 0.8}px ${g * 0.2}px ${c},
          -${g * 0.8}px -${g * 0.8}px ${g * 0.2}px ${c},
          ${g * 0.8}px -${g * 0.8}px ${g * 0.2}px ${c},
          -${g * 0.8}px ${g * 0.8}px ${g * 0.2}px ${c},
          ${g * 1.5}px 0 ${g * 0.3}px ${c},
          -${g * 1.5}px 0 ${g * 0.3}px ${c},
          0 ${g * 1.5}px ${g * 0.3}px ${c},
          0 -${g * 1.5}px ${g * 0.3}px ${c}
        `;
      case 'circular':
      default:
        return `
          0 0 ${g * 0.1}px ${c},
          0 0 ${g * 0.3}px ${c},
          0 0 ${g * 0.6}px ${c},
          0 0 ${g}px ${c},
          0 0 ${g * 1.5}px ${c}
        `;
    }
  };

  useEffect(() => {
    if (!isRainbow) {
      setHueRotate(0);
      return;
    }
    let animationFrameId: number;
    let lastTime = performance.now();

    const updateHue = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      const maxDegPerSec = 360;
      const minDegPerSec = 36;
      const degPerSec = minDegPerSec + ((rainbowSpeed - 1) / 99) * (maxDegPerSec - minDegPerSec);
      
      setHueRotate(prev => (prev + (degPerSec * delta) / 1000) % 360);
      animationFrameId = requestAnimationFrame(updateHue);
    };

    animationFrameId = requestAnimationFrame(updateHue);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isRainbow, rainbowSpeed]);

  useEffect(() => {
    if (animation !== 'typewriter') {
      setDisplayedText(text);
      return;
    }

    let i = 0;
    let timeoutId: NodeJS.Timeout;

    const typeInterval = 500 - ((animationSpeed - 1) / 99) * 450;
    const restartDelay = 4000 - ((animationSpeed - 1) / 99) * 3000;

    const typeChar = () => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i < text.length) {
        timeoutId = setTimeout(typeChar, typeInterval);
      } else {
        timeoutId = setTimeout(() => {
          i = 0;
          setDisplayedText('');
          timeoutId = setTimeout(typeChar, typeInterval * 3);
        }, restartDelay);
      }
    };

    setDisplayedText('');
    timeoutId = setTimeout(typeChar, typeInterval * 3);

    return () => clearTimeout(timeoutId);
  }, [text, animation, animationSpeed]);

  const updateContainerScale = () => {
    if (screenSize === 'auto') {
      if (previewContainerRef.current) {
        previewContainerRef.current.style.transform = 'none';
        previewContainerRef.current.style.width = '100%';
        previewContainerRef.current.style.height = '100%';
      }
      return;
    }

    if (!previewWrapperRef.current || !previewContainerRef.current) return;
    const wrapper = previewWrapperRef.current;
    const container = previewContainerRef.current;

    const [w, h] = screenSize.split('x').map(Number);
    const scaleX = wrapper.clientWidth / w;
    const scaleY = wrapper.clientHeight / h;
    const scale = Math.min(scaleX, scaleY);

    container.style.width = `${w}px`;
    container.style.height = `${h}px`;
    container.style.transform = `scale(${Math.max(0.01, scale)})`;
    container.style.transformOrigin = 'center center';
  };

  const updateScale = () => {
    if (!textWrapperRef.current || !textRef.current) return;
    const wrapper = textWrapperRef.current;
    const textEl = textRef.current;

    // Reset transform to measure intrinsic size
    textEl.style.transform = 'none';
    textEl.style.scale = '1';

    const wrapperWidth = wrapper.clientWidth;
    const wrapperHeight = wrapper.clientHeight;
    const textWidth = textEl.scrollWidth;
    const textHeight = textEl.scrollHeight;

    if (textWidth === 0 || textHeight === 0) return;

    // Calculate scale factor to dynamically fit the wrapper (with a 5% margin)
    const scaleX = wrapperWidth / textWidth;
    const scaleY = wrapperHeight / textHeight;
    let baseScale = Math.min(scaleX, scaleY) * 0.95;
    if (animation === 'marquee') {
      baseScale = scaleY * 0.8;
    } else if (animation === 'scroll-y') {
      baseScale = scaleX * 0.8;
    }
    const scale = baseScale * (textSize / 100);

    textEl.style.scale = `${Math.max(0.01, scale)}`;
  };

  useLayoutEffect(() => {
    updateContainerScale();
    updateScale();
  }, [screenSize]);

  useLayoutEffect(() => {
    updateScale();
  }, [text, glowIntensity, animation, fontFamily, effectStyle, textSize]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      updateContainerScale();
      updateScale();
    });
    if (previewWrapperRef.current) {
      resizeObserver.observe(previewWrapperRef.current);
    }
    if (textWrapperRef.current) {
      resizeObserver.observe(textWrapperRef.current);
    }
    return () => resizeObserver.disconnect();
  }, [screenSize]);

  const handleExport = async (format: 'png' | 'gif' | 'mp4') => {
    if (!previewContainerRef.current) return;
    setIsExporting(true);
    setExportProgress(0);
    setExportFormat(format);
    
    // Config for exporting exact dimensions if not 'auto'
    const exportConfig = {
      quality: 0.9,
      pixelRatio: screenSize === 'auto' ? 2 : 1,
      cacheBust: false,
      style: screenSize === 'auto' ? undefined : { transform: 'none' },
      width: screenSize === 'auto' ? undefined : Number(screenSize.split('x')[0]),
      height: screenSize === 'auto' ? undefined : Number(screenSize.split('x')[1]),
      skipFonts: true, // Speeds up html-to-image significantly
    };

    try {
      if (format === 'png') {
        const dataUrl = await toPng(previewContainerRef.current, exportConfig);
        const link = document.createElement('a');
        link.download = `led-banner-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      } else if (format === 'gif' || format === 'mp4') {
        const fps = format === 'mp4' ? 20 : 12; // Lower fps for faster export
        const delayBetweenFrames = 1000 / fps;
        const totalDuration = format === 'mp4' ? 2400 : 1200; // Shorter export duration
        const numFrames = animation === 'none' ? 1 : Math.ceil(totalDuration / delayBetweenFrames); 
        
        let width = 0;
        let height = 0;
        
        let muxer: MP4Muxer.Muxer<MP4Muxer.ArrayBufferTarget> | null = null;
        let videoEncoder: VideoEncoder | null = null;
        let gif: GIFEncoder | null = null;
        
        let timestamp = 0;

        for (let i = 0; i < numFrames; i++) {
          setExportProgress(Math.round((i / numFrames) * 100));
          const canvas = await toCanvas(previewContainerRef.current, exportConfig);
          
          if (i === 0) {
            width = canvas.width;
            height = canvas.height;
            
            if (format === 'mp4') {
              width = width % 2 === 0 ? width : width - 1;
              height = height % 2 === 0 ? height : height - 1;
              
              muxer = new MP4Muxer.Muxer({
                target: new MP4Muxer.ArrayBufferTarget(),
                video: {
                  codec: 'avc',
                  width,
                  height
                },
                fastStart: 'in-memory',
                firstTimestampBehavior: 'offset'
              });

              videoEncoder = new VideoEncoder({
                output: (chunk, meta) => muxer!.addVideoChunk(chunk, meta as any),
                error: e => console.error("VideoEncoder error:", e)
              });

              videoEncoder.configure({
                codec: 'avc1.42E033', // Level 5.1 to support up to 4K resolutions
                width,
                height,
                framerate: fps,
                bitrate: Math.max(2_000_000, width * height * 2), // Dynamic bitrate
              });
            } else {
              gif = new GIFEncoder();
            }
          }

          if (format === 'mp4' && videoEncoder && videoEncoder.state !== 'closed') {
            let finalCanvas = canvas;
            if (canvas.width !== width || canvas.height !== height) {
              finalCanvas = document.createElement('canvas');
              finalCanvas.width = width;
              finalCanvas.height = height;
              const ctx = finalCanvas.getContext('2d');
              if (ctx) ctx.drawImage(canvas, 0, 0, width, height);
            }
            
            let videoFrame = new VideoFrame(finalCanvas, { timestamp: Math.floor(timestamp) });
            try {
              videoEncoder.encode(videoFrame);
            } catch (encodeErr) {
              console.error("Encode error:", encodeErr);
            }
            videoFrame.close();
          } else if (format === 'gif' && gif) {
             const ctx = canvas.getContext('2d');
             if (ctx) {
               const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
               const palette = quantize(imgData.data, 256, { format: 'rgba4444' });
               const index = applyPalette(imgData.data, palette, 'rgba4444');
               gif.writeFrame(index, canvas.width, canvas.height, { palette, delay: delayBetweenFrames });
             }
          }

          timestamp += delayBetweenFrames * 1000;
          if (numFrames > 1) {
            await new Promise(r => setTimeout(r, 10)); // tiny yield to UI thread to update progress
          }
        }
        
        setExportProgress(100);

        if (format === 'mp4' && videoEncoder && muxer) {
          if (videoEncoder.state !== 'closed') {
            await videoEncoder.flush();
          }
          muxer.finalize();
          
          const buffer = (muxer.target as any).buffer as ArrayBuffer;
          const blob = new Blob([buffer], { type: 'video/mp4' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `led-banner-${Date.now()}.mp4`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        } else if (format === 'gif' && gif) {
          gif.finish();
          const bytes = gif.bytes();
          const blob = new Blob([bytes], { type: 'image/gif' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `led-banner-${Date.now()}.gif`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        }
      }
    } catch (err) {
      console.error('Failed to export', err);
      alert('Failed to export media.');
    } finally {
      setIsExporting(false);
    }
  };

  const textShadow = getEffectShadow(effectColor, glowIntensity);

  const getAnimationDuration = () => {
    if (animation === 'blink') {
      const maxDuration = 4;
      const minDuration = 0.1;
      const duration = maxDuration - ((blinkSpeed - 1) / 99) * (maxDuration - minDuration);
      return `${duration}s`;
    }
    if (['marquee', 'scroll-y'].includes(animation)) {
      const maxDuration = 30;
      const minDuration = 1;
      const duration = maxDuration - ((animationSpeed - 1) / 99) * (maxDuration - minDuration);
      return `${duration}s`;
    }
    if (['pulse', 'bounce'].includes(animation)) {
      const maxDuration = 5;
      const minDuration = 0.2;
      const duration = maxDuration - ((animationSpeed - 1) / 99) * (maxDuration - minDuration);
      return `${duration}s`;
    }
    if (animation === 'glitch') {
      const maxDuration = 1.5;
      const minDuration = 0.1;
      const duration = maxDuration - ((animationSpeed - 1) / 99) * (maxDuration - minDuration);
      return `${duration}s`;
    }
    return undefined;
  };

  return (
    <div className="flex h-screen w-full flex-col md:flex-row font-sans bg-zinc-950 text-gray-200 overflow-hidden">
      {/* Control Panel */}
      <div className="w-full h-auto md:h-screen md:w-[340px] lg:w-[380px] bg-zinc-950 border-r border-zinc-900 flex flex-col z-10 shadow-2xl relative shrink-0">
        <div className="p-6 border-b border-zinc-900 flex items-center gap-3">
          <div className="bg-zinc-800 p-2 rounded-lg text-zinc-100 shadow-sm border border-zinc-700/50">
            <LayoutTemplate className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white mb-0.5">LED Studio</h1>
            <p className="text-xs text-zinc-500 font-medium">Text Display Controller</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          {/* Text Input */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <Type className="w-4 h-4 text-zinc-500" />
              Display Text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full h-28 bg-[#0a0a0b] border border-zinc-800 rounded-xl p-4 text-white placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none transition-all shadow-inner text-sm leading-relaxed"
              placeholder="Enter text..."
              spellCheck={false}
            />
            
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-400">
                  Text Size
                </label>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {textSize}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                value={textSize}
                onChange={(e) => setTextSize(parseInt(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-zinc-300 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:bg-white transition-all"
              />
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <Palette className="w-4 h-4 text-zinc-500" />
              Text Color
            </label>
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => setIsRainbow(true)}
                className={`w-9 h-9 rounded-full border transition-transform hover:scale-110 active:scale-95 flex items-center justify-center ${isRainbow ? 'ring-2 ring-offset-2 ring-offset-zinc-950 ring-white border-transparent' : 'border-white/10'}`}
                style={{ background: 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)' }}
                aria-label="Rainbow Mode"
              />
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => { setColor(c); setIsRainbow(false); }}
                  className={`w-9 h-9 rounded-full border border-white/10 transition-transform hover:scale-110 active:scale-95 ${!isRainbow && color === c ? 'ring-2 ring-offset-2 ring-offset-zinc-950 ring-white' : ''}`}
                  style={{ backgroundColor: c, boxShadow: !isRainbow && color === c ? `0 0 16px ${c}40` : 'none' }}
                  aria-label={`Select color ${c}`}
                />
              ))}
              <div className={`relative w-9 h-9 rounded-full overflow-hidden border transition-colors shrink-0 shadow-sm flex items-center justify-center ${isRainbow ? 'border-zinc-700 bg-zinc-800' : 'border-zinc-700 hover:border-zinc-500 bg-zinc-800'}`}>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => { setColor(e.target.value); setIsRainbow(false); }}
                  className="absolute -inset-4 w-20 h-20 cursor-pointer opacity-0"
                />
                <div 
                   className="w-4 h-4 rounded-full pointer-events-none" 
                   style={{ backgroundColor: color }} 
                />
              </div>
            </div>

            {/* Rainbow Speed */}
            {isRainbow && (
              <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-zinc-400">
                    Rainbow Speed
                  </label>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {rainbowSpeed}%
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={rainbowSpeed}
                  onChange={(e) => setRainbowSpeed(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-zinc-300 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:bg-white transition-all"
                />
              </div>
            )}
          </div>

          {/* Font Selection */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <Baseline className="w-4 h-4 text-zinc-500" />
              Typography
            </label>
            <div className="relative">
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full bg-[#0a0a0b] border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none shadow-inner text-sm font-medium"
              >
                {FONT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Screen Size Selection */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <MonitorUp className="w-4 h-4 text-zinc-500" />
              Screen Registration
            </label>
            <div className="relative">
              <select
                value={screenSize}
                onChange={(e) => setScreenSize(e.target.value)}
                className="w-full bg-[#0a0a0b] border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none shadow-inner text-sm font-medium"
              >
                {SCREEN_SIZE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Effect Intensity */}
          <div className={`space-y-4 ${effectStyle === 'solid' ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                <Sliders className="w-4 h-4 text-zinc-500" />
                Effect Intensity
              </label>
              <span className="text-xs text-zinc-400 font-mono bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800">
                {glowIntensity}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={glowIntensity}
              onChange={(e) => setGlowIntensity(parseInt(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md hover:[&::-webkit-slider-thumb]:scale-110 transition-all"
            />
          </div>

          {/* Effect Style */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <Sun className="w-4 h-4 text-zinc-500" />
              Effect Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {EFFECT_STYLE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setEffectStyle(opt.id)}
                  className={`py-2 px-1 rounded-lg text-xs font-semibold tracking-wider transition-all border ${
                    effectStyle === opt.id
                      ? 'bg-zinc-800 text-white border-zinc-600 shadow-inner'
                      : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 hover:text-zinc-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Effect Color Selection */}
          <div className={`space-y-4 ${effectStyle === 'solid' ? 'hidden' : ''}`}>
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <Palette className="w-4 h-4 text-zinc-500" />
              Effect Color
            </label>
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => setIsEffectRainbow(true)}
                className={`w-9 h-9 rounded-full border transition-transform hover:scale-110 active:scale-95 flex items-center justify-center ${isEffectRainbow ? 'ring-2 ring-offset-2 ring-offset-zinc-950 ring-white border-transparent' : 'border-white/10'}`}
                style={{ background: 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)' }}
                aria-label="Rainbow Effect Mode"
              />
              {PRESET_COLORS.map((c) => (
                <button
                  key={`effect-${c}`}
                  onClick={() => { setEffectColor(c); setIsEffectRainbow(false); }}
                  className={`w-9 h-9 rounded-full border border-white/10 transition-transform hover:scale-110 active:scale-95 ${!isEffectRainbow && effectColor === c ? 'ring-2 ring-offset-2 ring-offset-zinc-950 ring-white' : ''}`}
                  style={{ backgroundColor: c, boxShadow: !isEffectRainbow && effectColor === c ? `0 0 16px ${c}40` : 'none' }}
                  aria-label={`Select effect color ${c}`}
                />
              ))}
              <div className={`relative w-9 h-9 rounded-full overflow-hidden border transition-colors shrink-0 shadow-sm flex items-center justify-center ${isEffectRainbow ? 'border-zinc-700 bg-zinc-800' : 'border-zinc-700 hover:border-zinc-500 bg-zinc-800'}`}>
                <input
                  type="color"
                  value={effectColor}
                  onChange={(e) => { setEffectColor(e.target.value); setIsEffectRainbow(false); }}
                  className="absolute -inset-4 w-20 h-20 cursor-pointer opacity-0"
                />
                <div 
                   className="w-4 h-4 rounded-full pointer-events-none" 
                   style={{ backgroundColor: effectColor }} 
                />
              </div>
            </div>
          </div>

          {/* Animation Selection */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <Activity className="w-4 h-4 text-zinc-500" />
              Animation
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ANIMATION_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setAnimation(opt.id)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border ${
                    animation === opt.id
                      ? 'bg-zinc-800 text-white border-zinc-600 shadow-inner'
                      : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 hover:text-zinc-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            
            {/* Speed Control */}
            {animation !== 'none' && (
              <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-zinc-400">
                    {animation === 'blink' ? 'Blink Rate' : 'Speed'}
                  </label>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {animation === 'blink' ? blinkSpeed : animationSpeed}%
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={animation === 'blink' ? blinkSpeed : animationSpeed}
                  onChange={(e) => {
                    if (animation === 'blink') {
                      setBlinkSpeed(parseInt(e.target.value));
                    } else {
                      setAnimationSpeed(parseInt(e.target.value));
                    }
                  }}
                  className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-zinc-300 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:bg-white transition-all"
                />
              </div>
            )}
          </div>
        </div>

        {/* Export Section */}
        <div className="p-6 border-t border-zinc-900 bg-zinc-950 flex flex-col gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('png')}
              disabled={isExporting}
              className="flex-1 py-3 px-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm"
            >
              <Download className="w-4 h-4" />
              {isExporting && exportFormat === 'png' ? '...' : 'PNG'}
            </button>
            <button
              onClick={() => handleExport('gif')}
              disabled={isExporting}
              className="flex-1 py-3 px-2 bg-white hover:bg-zinc-200 text-black font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.15)] text-sm"
            >
              <FileVideo className="w-4 h-4" />
              {isExporting && exportFormat === 'gif' ? `${exportProgress}%` : 'GIF'}
            </button>
            <button
              onClick={() => handleExport('mp4')}
              disabled={isExporting}
              className="flex-1 py-3 px-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_25px_rgba(59,130,246,0.3)] text-sm"
            >
              <FileVideo className="w-4 h-4" />
              {isExporting && exportFormat === 'mp4' ? `${exportProgress}%` : 'MP4'}
            </button>
          </div>
          <p className="text-center text-[10px] text-zinc-600 font-medium uppercase tracking-wider mt-1">
             Local high-res capture
          </p>
        </div>
      </div>

      {/* Preview Canvas */}
      <div className="flex-1 flex flex-col h-[60vh] md:h-screen bg-black relative p-4 md:p-8" ref={previewWrapperRef}>
        <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
          {/* Export Boundary layer */}
          <div
            ref={previewContainerRef}
            className={`absolute flex items-center justify-center p-4 md:p-8 led-grid select-none will-change-transform ${screenSize === 'auto' ? 'inset-0 w-full h-full' : ''}`}
          >
            {/* Dynamic sizing wrapper */}
          <div
            ref={textWrapperRef}
            className={`w-full h-full flex flex-col justify-center relative pointer-events-none z-10 ${
              animation === 'marquee' ? 'items-start overflow-hidden' : 'items-center'
            }`}
          >
            {/* Actual LED Text */}
            <div
              ref={textRef}
              className={`${fontFamily} leading-tight uppercase transition-transform origin-center grid will-change-transform ${
                animation === 'blink' ? 'animate-led-blink' : ''
              } ${animation === 'marquee' ? 'animate-led-marquee w-max min-w-full' : ''} ${
                animation === 'pulse' ? 'animate-led-pulse' : ''
              } ${animation === 'bounce' ? 'animate-led-bounce' : ''} ${
                animation === 'glitch' ? 'animate-led-glitch' : ''
              } ${animation === 'scroll-y' ? 'animate-led-scroll-y h-max min-h-full' : ''}`}
              style={{
                color: effectStyle === 'outline' ? 'transparent' : (isRainbow ? '#ff0000' : color),
                textShadow: isEffectRainbow ? getEffectShadow('#ff0000', glowIntensity) : textShadow,
                whiteSpace: animation === 'marquee' ? 'nowrap' : 'pre-wrap',
                textAlign: animation === 'marquee' ? 'left' : 'center',
                WebkitTextStroke: effectStyle === 'outline' ? `${Math.max(1, glowIntensity * 0.1)}px ${isEffectRainbow ? '#ff0000' : effectColor}` : undefined,
                filter: `brightness(1.2) hue-rotate(${hueRotate}deg)`, // Extra voltage push
                animationDuration: getAnimationDuration(),
              }}
            >
              <span className="col-start-1 row-start-1" style={{ visibility: animation === 'typewriter' ? 'hidden' : 'visible' }}>
                {text || ' '}
              </span>
              {animation === 'typewriter' && (
                <span className="col-start-1 row-start-1">
                  {displayedText}
                </span>
              )}
            </div>
          </div>
        </div>
        </div>

        {/* Live Preview Badge */}
        <div className="absolute top-4 right-4 bg-zinc-950/70 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium text-zinc-300 pointer-events-none select-none border border-white/5 flex items-center gap-2 shadow-xl z-20">
          <Monitor className="w-3.5 h-3.5 text-zinc-400" />
          Live Preview
        </div>
      </div>
    </div>
  );
}
