
export interface Piece {
  id: number;
  correctIndex: number;
  currentBoardSlot: number | null;
  imageUrl: string;
  bgPos: { x: number, y: number };
  clipPath: string; // SVG path for the jigsaw shape
  viewBox: string;  // Viewbox for the piece SVG
}

export interface ArtWork {
  id: string;
  title: string;
  artist: string;
  year: string;
  imageUrl: string;
  description: string;
}

export interface GameState {
  pieces: Piece[];
  isWon: boolean;
  moves: number;
  artInfo: ArtWork | null;
  loading: boolean;
}
