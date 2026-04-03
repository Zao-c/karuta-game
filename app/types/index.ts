type CharacterId = string;
type MusicId = string;
type CardId = string;
type PlayerId = string | number;

type CharacterConfig = {
  id: CharacterId;
  name: string;
  anime: string;
  emoji: string;
  card: Array<CardId>;
  quotes: Array<string>;
  color: string;
  musicSource?: string;
  coverImage?: string;
  coverImageMedium?: string;
  description?: string;
  score?: number;
  popularity?: number;
}

type CharacterConfigMap = Map<CharacterId, CharacterConfig>;

enum PlaybackState {
  Stopped,
  Playing,
  CountingDown,
  TimeoutPause,
}

class Playback {
  currentTime: number = 0;
  duration: number = 0;
}

type PlaybackSetting = {
  countdown: boolean;
  randomStartPosition: boolean;
  playbackDuration: number;
}

enum GameMode {
  AutoRandom,
  Judge,
}

enum GamePhase {
  Lobby,
  SelectingCards,
  Playing,
  TurnResult,
  GameEnd,
}

type PlayerInfo = {
  id: PlayerId;
  name: string;
  avatar?: string;
  isHost: boolean;
  isObserver: boolean;
  isLocked: boolean;
  isReady: boolean;
  score: number;
  combo: number;
  maxCombo: number;
  correctCount: number;
  wrongCount: number;
  totalReactionTime: number;
  deck: Array<CardInfo>;
  collected: Array<CardInfo>;
  seatIndex: number;
}

type CustomCard = {
  id: string;
  name: string;
  anime: string;
  coverImage: string;
  quotes: string[];
  color: string;
}

class CardInfo {
  characterId: CharacterId | null;
  cardIndex: number;
  
  constructor(characterId: CharacterId | null, cardIndex: number) {
    this.characterId = characterId;
    this.cardIndex = cardIndex;
  }
  
  toKey(): string {
    return `${this.characterId}-${this.cardIndex}`;
  }
  
  equals(other: CardInfo): boolean {
    return this.characterId === other.characterId && this.cardIndex === other.cardIndex;
  }
}

type PickEvent = {
  timestamp: number;
  playerId: PlayerId;
  cardInfo: CardInfo;
  reactionTime: number;
  isCorrect: boolean;
}

type RoomState = {
  roomId: string;
  hostId: PlayerId;
  players: Array<PlayerInfo>;
  gameMode: GameMode;
  gamePhase: GamePhase;
  currentCharacterId: CharacterId | null;
  currentQuote: string | null;
  turnStartTime: number | null;
  pickEvents: Array<PickEvent>;
  deckRows: number;
  deckColumns: number;
  playbackSetting: PlaybackSetting;
  paused: boolean;
  pausedTimeRemaining: number;
  customCards: Array<CustomCard>;
  deckType: 'anime2026' | 'custom';
  deckCards: Array<{
    id: string;
    name: string;
    anime: string;
    emoji: string;
    card: string[];
    quotes: string[];
    color: string;
    coverImage?: string;
    coverImageMedium?: string;
  }>;
  currentTurnPicks: Array<{
    playerId: PlayerId;
    cardId: string;
    isCorrect: boolean;
    reactionTime: number;
  }>;
  createdAt: number;
  gameEndedAt?: number;
}

type GameState = {
  phase: GamePhase;
  currentTurn: number;
  totalTurns: number;
  timeRemaining: number;
}

type Event = {
  type: string;
  [key: string]: unknown;
}

type ChatMessage = {
  id: string;
  sender: PlayerId | 'system';
  senderName: string;
  message: string;
  timestamp: number;
}

export type {
  CharacterId,
  MusicId,
  CardId,
  PlayerId,
  CharacterConfig,
  CharacterConfigMap,
  PlaybackSetting,
  PlayerInfo,
  PickEvent,
  RoomState,
  GameState,
  Event,
  ChatMessage,
  CustomCard,
};

export {
  PlaybackState,
  Playback,
  GameMode,
  GamePhase,
  CardInfo,
};
