
import React, { useState, useEffect } from 'react';
import { ArtWork } from './types';
import PuzzleGame from './components/PuzzleGame';
import { getArtFact } from './services/geminiService';

/**
 * Enhanced Proxy URL helper.
 * Uses images.weserv.nl to handle CORS and image optimization.
 */
const getProxiedUrl = (url: string) => {
  return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=1000&fit=contain&output=jpg&q=85`;
};

const ARTWORKS: ArtWork[] = [
  {
    id: 'monalisa',
    title: 'Mona Lisa',
    artist: 'Leonardo da Vinci',
    year: 'c. 1503–1506',
    imageUrl: getProxiedUrl('https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/600px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg'),
    description: 'The world\'s most famous portrait.'
  }
];

const App: React.FC = () => {
  const [selectedArt, setSelectedArt] = useState<ArtWork | null>(null);
  const [artFact, setArtFact] = useState<string>('');
  const [isGameStarted, setIsGameStarted] = useState(false);

  useEffect(() => {
    if (selectedArt) {
      const fetchFact = async () => {
        setArtFact('');
        const fact = await getArtFact(selectedArt.title);
        setArtFact(fact);
      };
      fetchFact();
    }
  }, [selectedArt]);

  const handleStartGame = () => {
    if (selectedArt) setIsGameStarted(true);
  };

  const handleBackToGallery = () => {
    setIsGameStarted(false);
    setSelectedArt(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30">
      <header className="py-6 px-4 bg-slate-900/50 border-b border-white/10 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="cursor-pointer group" onClick={handleBackToGallery}>
            <h1 className="text-2xl font-serif text-amber-400 group-hover:text-amber-300 transition-colors">Artheum</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Masterpiece Restoration</p>
          </div>
          <div className="hidden md:block">
            <span className="text-xs font-medium text-slate-500 italic uppercase tracking-widest">Digital Jigsaw Challenge</span>
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center p-4">
        {!isGameStarted ? (
          <div className="max-w-6xl w-full py-8 space-y-12 animate-fade-in">
            {!selectedArt ? (
              <div className="space-y-10">
                <div className="text-center space-y-2">
                  <h2 className="text-4xl md:text-5xl font-serif text-white italic">The Grand Gallery</h2>
                  <p className="text-amber-500 text-[10px] font-black tracking-[0.4em] uppercase">Select a masterpiece to restore</p>
                </div>
                
                <div className="grid grid-cols-1 gap-8 pb-10 max-w-sm mx-auto">
                  {ARTWORKS.map((art) => (
                    <div 
                      key={art.id}
                      onClick={() => setSelectedArt(art)}
                      className="group relative cursor-pointer overflow-hidden rounded-3xl border border-white/10 hover:border-amber-500/50 transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] bg-slate-900"
                    >
                      <div className="aspect-[4/5] overflow-hidden bg-slate-800 flex items-center justify-center">
                        <img 
                          src={art.imageUrl} 
                          alt={art.title} 
                          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://via.placeholder.com/800x1000/1e293b/fbbf24?text=${encodeURIComponent(art.title)}`;
                          }}
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent p-6 flex flex-col justify-end">
                        <h3 className="text-xl font-serif text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">{art.title}</h3>
                        <p className="text-amber-400 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">{art.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-10 text-center animate-fade-in">
                <div className="relative mx-auto w-64 h-80 overflow-hidden rounded-[2rem] border-4 border-amber-600 shadow-2xl bg-slate-900">
                   <img 
                    src={selectedArt.imageUrl} 
                    alt={selectedArt.title} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://via.placeholder.com/400x500/1e293b/fbbf24?text=${encodeURIComponent(selectedArt.title)}`;
                    }}
                  />
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h2 className="text-4xl font-serif text-white">{selectedArt.title}</h2>
                    <p className="text-amber-500 font-black tracking-widest text-[11px] uppercase mt-2">{selectedArt.artist}, {selectedArt.year}</p>
                  </div>
                  
                  <div className="bg-slate-900/40 p-6 rounded-3xl border border-white/5 relative min-h-[5rem] flex items-center justify-center">
                    <span className="absolute -top-3 left-6 px-3 bg-amber-600 text-amber-950 text-[9px] font-black rounded-full py-1">CURATOR'S NOTE</span>
                    <p className="text-slate-300 italic text-sm leading-relaxed px-4">
                      "{artFact || 'Fetching historical data...'}"
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => setSelectedArt(null)}
                      className="flex-1 py-4 border border-white/10 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all active:scale-95"
                    >
                      Gallery
                    </button>
                    <button 
                      onClick={handleStartGame}
                      className="flex-[2] py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all transform hover:scale-[1.02] shadow-xl shadow-amber-900/20 active:scale-95"
                    >
                      Begin Restoration
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <PuzzleGame art={selectedArt} onBack={handleBackToGallery} />
        )}
      </main>

      <footer className="py-6 text-center text-slate-600 text-[10px] font-black border-t border-white/5 tracking-[0.3em] uppercase">
        &copy; 2024 Artheum Labs &bull; Powered by Gemini
      </footer>
    </div>
  );
};

export default App;
