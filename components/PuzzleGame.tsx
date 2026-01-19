
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Piece, ArtWork } from '../types';

interface PuzzleGameProps {
  art: ArtWork;
  onBack: () => void;
}

const ROWS = 4;
const COLS = 3;
const PIECE_COUNT = ROWS * COLS;

const playSound = (type: 'pick' | 'success' | 'error' | 'win') => {
  const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  const now = ctx.currentTime;

  if (type === 'pick') {
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.1);
    gain.gain.setValueAtTime(0.08, now);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (type === 'success') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(659.25, now + 0.1);
    gain.gain.setValueAtTime(0.1, now);
    osc.start(now);
    osc.stop(now + 0.25);
  } else if (type === 'error') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(100, now);
    gain.gain.setValueAtTime(0.1, now);
    osc.start(now);
    osc.stop(now + 0.2);
  } else if (type === 'win') {
    [523, 659, 783, 1046].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.setValueAtTime(f, now + i * 0.1);
      g.gain.setValueAtTime(0.1, now + i * 0.1);
      g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.6);
      o.start(now + i * 0.1); o.stop(now + i * 0.1 + 0.6);
    });
  }
};

const PuzzleGame: React.FC<PuzzleGameProps> = ({ art, onBack }) => {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [boardSlots, setBoardSlots] = useState<(number | null)[]>(new Array(PIECE_COUNT).fill(null));
  const [selectedPieceId, setSelectedPieceId] = useState<number | null>(null);
  const [errorSlot, setErrorSlot] = useState<number | null>(null);
  const [isWon, setIsWon] = useState(false);

  // Random rotations for the pieces in the tray to make it feel more "scattered"
  const pieceRotations = useMemo(() => {
    return Array.from({ length: PIECE_COUNT }, () => (Math.random() - 0.5) * 40);
  }, [art.id]);

  const generatePieces = useCallback(() => {
    // Variable sizing for the puzzle pieces to create "irregular" shards
    const getWeights = (count: number) => {
        const weights = Array.from({ length: count }, () => 0.6 + Math.random() * 1.8);
        const sum = weights.reduce((a, b) => a + b, 0);
        const normalized = weights.map(w => w / sum);
        const starts = [0];
        let acc = 0;
        for (let i = 0; i < count; i++) {
            acc += normalized[i];
            starts.push(i === count - 1 ? 1 : acc);
        }
        return starts;
    };

    const colStarts = getWeights(COLS);
    const rowStarts = getWeights(ROWS);

    const points: { x: number, y: number }[][] = [];
    const jitter = 0.5;

    for (let r = 0; r <= ROWS; r++) {
      points[r] = [];
      for (let c = 0; c <= COLS; c++) {
        let x = colStarts[c];
        let y = rowStarts[r];
        if (c > 0 && c < COLS) x += (Math.random() - 0.5) * (jitter / COLS);
        if (r > 0 && r < ROWS) y += (Math.random() - 0.5) * (jitter / ROWS);
        points[r][c] = { x, y };
      }
    }

    const hMids: { x: number, y: number }[][] = [];
    for (let r = 0; r <= ROWS; r++) {
      hMids[r] = [];
      for (let c = 0; c < COLS; c++) {
        const p1 = points[r][c];
        const p2 = points[r][c+1];
        hMids[r][c] = {
          x: (p1.x + p2.x) / 2 + (Math.random() - 0.5) * (jitter / COLS / 2),
          y: (p1.y + p2.y) / 2 + (Math.random() - 0.5) * (jitter / ROWS / 2)
        };
      }
    }
    const vMids: { x: number, y: number }[][] = [];
    for (let r = 0; r < ROWS; r++) {
      vMids[r] = [];
      for (let c = 0; c <= COLS; c++) {
        const p1 = points[r][c];
        const p2 = points[r+1][c];
        vMids[r][c] = {
          x: (p1.x + p2.x) / 2 + (Math.random() - 0.5) * (jitter / COLS / 2),
          y: (p1.y + p2.y) / 2 + (Math.random() - 0.5) * (jitter / ROWS / 2)
        };
      }
    }

    const newPieces: Piece[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const id = r * COLS + c;
        const poly = [
            points[r][c], hMids[r][c], points[r][c+1], vMids[r][c+1],
            points[r+1][c+1], hMids[r+1][c], points[r+1][c], vMids[r][c]
        ];

        const minX = Math.min(...poly.map(p => p.x));
        const maxX = Math.max(...poly.map(p => p.x));
        const minY = Math.min(...poly.map(p => p.y));
        const maxY = Math.max(...poly.map(p => p.y));
        const w = maxX - minX;
        const h = maxY - minY;

        const local = poly.map(p => ({
            x: (p.x - minX) / w,
            y: (p.y - minY) / h
        }));

        const path = `M ${local[0].x} ${local[0].y} ` + local.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') + ' Z';

        newPieces.push({
          id,
          correctIndex: id,
          currentBoardSlot: null,
          imageUrl: art.imageUrl,
          bgPos: { x: minX, y: minY, w: w, h: h } as any,
          clipPath: path,
          viewBox: "0 0 1 1"
        });
      }
    }
    setPieces([...newPieces].sort(() => Math.random() - 0.5));
  }, [art.imageUrl]);

  useEffect(() => { 
    setBoardSlots(new Array(PIECE_COUNT).fill(null));
    setIsWon(false);
    setSelectedPieceId(null);
    generatePieces(); 
  }, [generatePieces, art.id]);

  const handlePieceClick = (id: number) => {
    if (isWon) return;
    const piece = pieces.find(p => p.id === id);
    if (!piece) return;

    if (piece.currentBoardSlot !== null) {
      // Piece is on board, take it back to tray
      const slotIdx = piece.currentBoardSlot;
      setBoardSlots(prev => {
        const next = [...prev];
        next[slotIdx] = null;
        return next;
      });
      setPieces(prev => prev.map(p => p.id === id ? { ...p, currentBoardSlot: null } : p));
      setSelectedPieceId(id);
      playSound('pick');
    } else {
      // Toggle selection
      setSelectedPieceId(prev => prev === id ? null : id);
      if (selectedPieceId !== id) playSound('pick');
    }
  };

  const handleSlotClick = (idx: number) => {
    if (selectedPieceId === null || isWon || boardSlots[idx] !== null) return;
    const piece = pieces.find(p => p.id === selectedPieceId);
    if (!piece || piece.correctIndex !== idx) {
      setErrorSlot(idx);
      playSound('error');
      setTimeout(() => setErrorSlot(null), 500);
      return;
    }
    setBoardSlots(prev => {
      const next = [...prev];
      next[idx] = selectedPieceId;
      return next;
    });
    setPieces(prev => prev.map(p => p.id === selectedPieceId ? { ...p, currentBoardSlot: idx } : p));
    setSelectedPieceId(null);
    playSound('success');

    // Check for win condition
    setTimeout(() => {
        const currentPieces = pieces.map(p => p.id === selectedPieceId ? { ...p, currentBoardSlot: idx } : p);
        if (currentPieces.every(p => p.currentBoardSlot === p.correctIndex)) {
          setIsWon(true);
          playSound('win');
        }
    }, 100);
  };

  const trayPieces = useMemo(() => pieces.filter(p => p.currentBoardSlot === null), [pieces]);

  return (
    <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 items-center lg:items-start p-4 pb-24">
      <svg width="0" height="0" className="absolute pointer-events-none">
        <defs>
          {pieces.map(p => (
            <clipPath key={p.id} id={`clip-${p.id}`} clipPathUnits="objectBoundingBox">
              <path d={p.clipPath} />
            </clipPath>
          ))}
        </defs>
      </svg>

      {/* LEFT: Game Board */}
      <div className="flex-1 flex flex-col items-center">
        <div className="mb-6 w-full max-w-[320px] flex justify-between items-end px-2">
          <button onClick={onBack} className="text-amber-500 font-black text-[10px] tracking-widest hover:text-white transition-colors uppercase group">
            <span className="inline-block group-hover:-translate-x-1 transition-transform">←</span> Back
          </button>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 font-black tracking-tight uppercase">Restoration</p>
            <p className="text-2xl font-serif text-amber-400 leading-none italic">
              {boardSlots.filter(s => s !== null).length} <span className="text-sm opacity-50">/</span> {PIECE_COUNT}
            </p>
          </div>
        </div>

        <div className={`relative p-1 bg-slate-900 rounded-[2.5rem] shadow-2xl border-4 border-slate-800/80 transition-transform ${errorSlot !== null ? 'animate-shake' : ''}`}>
          <div 
            className="relative bg-slate-950 rounded-[2.2rem] overflow-hidden"
            style={{ width: 'min(85vw, 320px)', height: 'min(113vw, 426px)' }}
          >
            {/* Guide image is slightly visible for gameplay assistance */}
            <img 
              src={art.imageUrl} 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover opacity-[0.12] grayscale pointer-events-none" 
              referrerPolicy="no-referrer"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            
            <div className="absolute inset-0 z-10">
              {pieces.map((p) => {
                  const bp = p.bgPos as any;
                  const idx = p.correctIndex;
                  const isPlaced = boardSlots[idx] !== null;
                  
                  return (
                    <div 
                      key={`slot-${p.id}`}
                      onClick={() => handleSlotClick(idx)}
                      style={{
                        position: 'absolute',
                        left: `${bp.x * 100}%`,
                        top: `${bp.y * 100}%`,
                        width: `${bp.w * 100}%`,
                        height: `${bp.h * 100}%`,
                        zIndex: isPlaced ? 30 : 20
                      }}
                      className={`cursor-pointer bg-transparent transition-colors duration-200
                        ${errorSlot === idx ? 'bg-red-500/10' : ''}
                      `}
                    >
                      {isPlaced && (
                        <div className="absolute inset-0 z-40 pointer-events-auto" 
                             onClick={(e) => { e.stopPropagation(); handlePieceClick(p.id); }}>
                          <PieceItem piece={p} isWon={isWon} />
                        </div>
                      )}
                    </div>
                  );
              })}
            </div>
          </div>

          {isWon && (
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-center z-50 rounded-[2.4rem] animate-fade-in border-4 border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.2)]">
               <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-amber-500/40 animate-bounce">
                 <span className="text-3xl">✨</span>
               </div>
               <h2 className="text-3xl font-serif text-white mb-2 italic tracking-wide">Restored</h2>
               <p className="text-amber-400 text-[10px] font-black tracking-[0.4em] mb-12 uppercase">Exhibition Quality</p>
               <button onClick={onBack} className="bg-amber-600 text-white px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-500 transition-all shadow-xl active:scale-95">Next Masterpiece</button>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Inventory Tray */}
      <div className="w-full lg:w-96 flex flex-col gap-6">
        <div className="bg-slate-900/90 border border-white/5 rounded-[2.5rem] p-6 backdrop-blur-md shadow-2xl min-h-[500px] lg:min-h-[550px] relative">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-serif text-amber-100 text-xl italic">Fragment Tray</h3>
            <span className="text-[10px] bg-amber-600/20 text-amber-400 px-3 py-1 rounded-full border border-amber-600/30 font-black tracking-widest uppercase">{trayPieces.length} Shards</span>
          </div>

          <div className="relative w-full h-[400px] lg:h-[600px] overflow-y-auto overflow-x-hidden p-6 custom-scrollbar flex flex-wrap gap-x-6 gap-y-16 justify-center content-start">
            {pieces.map(piece => {
              if (piece.currentBoardSlot !== null) return null;
              const isSelected = selectedPieceId === piece.id;
              const rotation = pieceRotations[piece.id];
              const bp = piece.bgPos as any;
              const sizeScale = (bp.w * COLS + bp.h * ROWS) / 2;
              
              return (
                <div 
                  key={`tray-${piece.id}`} 
                  className={`relative cursor-pointer transition-all duration-300`}
                  style={{ 
                    width: `${Math.max(30, 40 * sizeScale)}%`,
                    aspectRatio: `${bp.w / bp.h}`,
                    transform: `rotate(${rotation}deg) ${isSelected ? 'scale(1.15) rotate(0deg)' : 'scale(1)'}`,
                    zIndex: isSelected ? 50 : 1
                  }}
                  onClick={() => handlePieceClick(piece.id)}
                >
                  <div className={`w-full h-full transition-all duration-300 
                    ${isSelected ? 'drop-shadow-[0_20px_40px_rgba(245,158,11,0.6)]' : 'drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]'}
                  `}>
                    <PieceItem piece={piece} isSelected={isSelected} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 bg-slate-900/40 rounded-[2rem] border border-white/5 relative group border-l-4 border-l-amber-600">
          <p className="text-amber-500 text-[10px] font-black uppercase tracking-widest mb-2">Curator's Tip</p>
          <p className="text-[11px] text-slate-400 leading-relaxed font-medium italic">"The Mona Lisa is waiting to be restored. Select a shard and tap the correct location to complete the masterpiece."</p>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translate(0, 0); }
          10%, 30%, 50%, 70%, 90% { transform: translate(-5px, 0); }
          20%, 40%, 60%, 80% { transform: translate(5px, 0); }
        }
        .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>
    </div>
  );
};

const PieceItem: React.FC<{ piece: Piece; isSelected?: boolean; isWon?: boolean }> = ({ piece, isSelected, isWon }) => {
  const bp = piece.bgPos as any;
  const bgWidth = (1 / bp.w) * 100;
  const bgHeight = (1 / bp.h) * 100;
  const bgLeft = -(bp.x / bp.w) * 100;
  const bgTop = -(bp.y / bp.h) * 100;

  return (
    <div className={`w-full h-full relative transition-all duration-300 overflow-visible ${isSelected ? 'brightness-125 saturate-110' : ''}`}
      style={{ clipPath: `url(#clip-${piece.id})`, WebkitClipPath: `url(#clip-${piece.id})` }}
    >
      <img 
        src={piece.imageUrl} 
        alt="" 
        className="absolute max-w-none pointer-events-none"
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        style={{ 
          width: `${bgWidth}%`,
          height: `${bgHeight}%`,
          left: `${bgLeft}%`,
          top: `${bgTop}%`,
          filter: isWon ? 'none' : 'contrast(1.05) brightness(1.05)' 
        }}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = `https://via.placeholder.com/400x400/1e293b/fbbf24?text=Piece`;
        }}
      />
      {!isWon && <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)] opacity-40 pointer-events-none" />}
      {isSelected && <div className="absolute inset-0 ring-[6px] ring-inset ring-amber-500/50 mix-blend-screen pointer-events-none" />}
    </div>
  );
};

export default PuzzleGame;
