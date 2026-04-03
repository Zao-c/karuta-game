"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box, Button, Paper, Stack, Typography, TextField, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Slider,
  Chip, Avatar, Tooltip, CircularProgress, LinearProgress, Alert
} from '@mui/material';
import {
  PlayArrow, Pause, SkipNext, SkipPrevious, VolumeUp, VolumeOff,
  Groups, Person, Settings, ExitToApp, ContentCopy, EmojiPeople,
  Lock, LockOpen, Casino, SportsEsports, Timer, Star, TrendingUp,
  Add, Delete, Upload, CheckCircle, Visibility, AccountCircle
} from '@mui/icons-material';
import {
  CharacterConfig, CharacterConfigMap, GameMode, GamePhase,
  PlayerInfo, PickEvent, RoomState, ChatMessage, CustomCard
} from './types';
import { getCharacterDataFromAnime, getAnimeConfigMap, getRandomAnimeQuote, shuffleArray, getAnimeData } from './data/anime2026';
import { roomSync, RoomInfo } from '../lib/roomSync';
import { roomService, SupabaseRoomDiagnostic } from '../lib/roomService';
import { isSupabaseConfigured } from '../lib/supabase';
import { authService } from '../lib/authService';
import { globalDeckService, GlobalDeck } from '../lib/globalDeckService';
import { userProfileService, UserProfile, UserDeck } from '../lib/userProfileService';
import { storageService } from '../lib/storageService';
import ProfilePage from '../components/ProfilePage';
import GuessSongGame from '../components/GuessSongGame';
import SongLibraryManager from '../components/SongLibraryManager';

type CharacterId = string;

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

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generatePlayerId(): number {
  return Math.floor(Math.random() * 1000000);
}

function getRoomPhaseLabel(phase: GamePhase | number): string {
  if (phase === GamePhase.Lobby || phase === 0) return '鍑嗗涓?;
  if (phase === GamePhase.Playing || phase === 2) return '娓告垙涓?;
  if (phase === GamePhase.GameEnd || phase === 3) return '宸茬粨鏉?;
  return '杩涜涓?;
}

function SakuraBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    for (let i = 0; i < 30; i++) {
      const sakura = document.createElement('div');
      sakura.className = 'sakura';
      sakura.style.left = Math.random() * 100 + '%';
      sakura.style.animationDuration = (Math.random() * 5 + 8) + 's';
      sakura.style.animationDelay = Math.random() * 10 + 's';
      sakura.style.opacity = String(Math.random() * 0.5 + 0.3);
      container.appendChild(sakura);
    }
    
    return () => {
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, []);
  
  return <div ref={containerRef} className="sakura-container" />;
}

function renderUserAvatar(avatar: string | undefined, size: number = 40) {
  if (!avatar) {
    return (
      <Avatar sx={{ width: size, height: size, bgcolor: '#ff6b9d', fontSize: size * 0.4 }}>
        馃幃
      </Avatar>
    );
  }
  
  if (avatar.startsWith('emoji:')) {
    const [, emoji, color] = avatar.split(':');
    return (
      <Avatar sx={{ width: size, height: size, bgcolor: color || '#ff6b9d', fontSize: size * 0.4 }}>
        {emoji || '馃幃'}
      </Avatar>
    );
  }
  
  return (
    <Avatar 
      src={avatar} 
      sx={{ width: size, height: size }}
    />
  );
}

function CharacterCard({
  character,
  width = 150,
  raised = false,
  disabled = false,
  correct = false,
  wrong = false,
  onClick,
  showQuote = true,
}: {
  character: CharacterConfig;
  width?: number;
  raised?: boolean;
  disabled?: boolean;
  correct?: boolean;
  wrong?: boolean;
  onClick?: () => void;
  showQuote?: boolean;
}) {
  const cardClasses = [
    'card',
    correct ? 'card-correct' : '',
    wrong ? 'card-wrong' : '',
  ].filter(Boolean).join(' ');
  
  return (
    <Paper
      className={cardClasses}
      onClick={disabled ? undefined : onClick}
      sx={{
        width: width,
        background: character.coverImage 
          ? `linear-gradient(135deg, ${character.color}40 0%, ${character.color}80 100%)`
          : `linear-gradient(135deg, ${character.color}40 0%, ${character.color}80 100%)`,
        borderRadius: 2,
        padding: 1.5,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s ease',
        transform: raised ? 'translateY(-8px) scale(1.02)' : 'none',
        border: '3px solid transparent',
        borderColor: correct ? '#4ade80' : wrong ? '#ff4757' : raised ? '#ff6b9d' : 'transparent',
        opacity: disabled ? 0.5 : 1,
        position: 'relative',
        overflow: 'hidden',
        '&:hover': disabled ? {} : {
          transform: 'translateY(-8px) scale(1.02)',
          borderColor: '#ff6b9d',
          boxShadow: '0 15px 40px rgba(255, 107, 157, 0.4)',
        },
      }}
    >
      <Box
        sx={{
          width: '100%',
          aspectRatio: '3/4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: width * 0.4,
          background: character.coverImage 
            ? `url(${character.coverImageMedium || character.coverImage}) center/cover`
            : `linear-gradient(135deg, ${character.color}30 0%, ${character.color}60 100%)`,
          borderRadius: 1,
          mb: 1,
          position: 'relative',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)',
            animation: 'shine 3s ease infinite',
          },
        }}
      >
        {!character.coverImage && character.emoji}
      </Box>
      <Typography
        sx={{
          fontFamily: '"ZCOOL KuaiLe", cursive',
          fontSize: width * 0.08,
          color: '#2d1b4e',
          textAlign: 'center',
          mb: 0.5,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {character.name}
      </Typography>
      {showQuote && (
        <Typography
          sx={{
            fontSize: width * 0.055,
            color: '#666',
            textAlign: 'center',
            lineHeight: 1.4,
            height: width * 0.12,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {character.anime}
        </Typography>
      )}
    </Paper>
  );
}

function CircularCountdown({ time, maxTime }: { time: number; maxTime: number }) {
  const progress = (time / maxTime) * 100;
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <Box className="circular-progress">
      <svg width={80} height={80}>
        <circle className="bg" cx={40} cy={40} r={36} />
        <circle
          className="progress"
          cx={40}
          cy={40}
          r={36}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: time <= 5 ? '#ff4757' : '#fff',
        }}
      >
        {time}
      </Box>
    </Box>
  );
}

function PlayerSeat({
  player,
  isSelf,
  onThrowEgg,
  showControls = true,
}: {
  player: PlayerInfo;
  isSelf: boolean;
  onThrowEgg?: () => void;
  showControls?: boolean;
}) {
  return (
    <Paper
      sx={{
        p: 1.5,
        background: isSelf
          ? 'linear-gradient(135deg, rgba(255,107,157,0.3) 0%, rgba(199,125,255,0.3) 100%)'
          : 'rgba(255,255,255,0.1)',
        borderRadius: 2,
        position: 'relative',
        border: isSelf ? '2px solid #ff6b9d' : '1px solid rgba(255,255,255,0.2)',
      }}
    >
      {player.isLocked && (
        <Box className="locked-overlay">
          <Lock sx={{ fontSize: 32, color: '#ff4757' }} />
        </Box>
      )}
      <Stack direction="row" spacing={1} alignItems="center">
        {player.avatar ? (
          player.avatar.startsWith('emoji:') ? (
            <Avatar
              sx={{
                bgcolor: player.avatar.split(':')[2] || '#ff6b9d',
                width: 40,
                height: 40,
              }}
            >
              {player.avatar.split(':')[1] || '馃幃'}
            </Avatar>
          ) : (
            <Avatar
              src={player.avatar}
              sx={{ width: 40, height: 40 }}
            />
          )
        ) : (
          <Avatar
            sx={{
              bgcolor: player.isHost ? '#ffd700' : '#c77dff',
              width: 40,
              height: 40,
            }}
          >
            {player.name.charAt(0).toUpperCase()}
          </Avatar>
        )}
        <Box>
          <Typography sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
            {player.name}
            {player.isHost && <Star sx={{ fontSize: 14, color: '#ffd700', ml: 0.5 }} />}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={`${player.score}鍒哷}
              size="small"
              sx={{ height: 20, fontSize: '0.7rem' }}
              color="primary"
            />
            {player.combo > 0 && (
              <Chip
                label={`${player.combo}杩炲嚮`}
                size="small"
                sx={{ height: 20, fontSize: '0.7rem' }}
                color="secondary"
              />
            )}
          </Stack>
        </Box>
        {showControls && !isSelf && onThrowEgg && (
          <Tooltip title="鎵旈浮铔?>
            <IconButton size="small" onClick={onThrowEgg}>
              馃
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </Paper>
  );
}

function CustomCardUploader({ onAddCard }: { onAddCard: (card: CustomCard) => void }) {
  const [name, setName] = useState('');
  const [anime, setAnime] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [quote, setQuote] = useState('');
  const [color, setColor] = useState('#ff6b9d');
  const [uploadingCover, setUploadingCover] = useState(false);
  
  const handleAddCard = () => {
    if (!name || !anime || !coverUrl || !quote) {
      alert('璇峰～鍐欐墍鏈夊瓧娈碉紒');
      return;
    }
    
    const newCard: CustomCard = {
      id: `custom_${Date.now()}`,
      name,
      anime,
      coverImage: coverUrl,
      quotes: [quote],
      color,
    };
    
    onAddCard(newCard);
    setName('');
    setAnime('');
    setCoverUrl('');
    setQuote('');
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const uploadResult = await storageService.uploadPublicFile({
        bucket: 'cover-images',
        file,
        fileName: file.name,
        folder: 'custom-cards',
        contentType: file.type || undefined,
      });
      setCoverUrl(uploadResult.publicUrl);
    } catch (error) {
      alert(`鍥剧墖涓婁紶澶辫触锛?{error instanceof Error ? error.message : '璇风◢鍚庨噸璇?}`);
    } finally {
      setUploadingCover(false);
      e.target.value = '';
    }
  };
  
  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2}>
        <TextField
          label="瑙掕壊/姝屾洸鍚嶇О"
          value={name}
          onChange={(e) => setName(e.target.value)}
          size="small"
          sx={{ flex: 1 }}
        />
        <TextField
          label="鏉ユ簮浣滃搧"
          value={anime}
          onChange={(e) => setAnime(e.target.value)}
          size="small"
          sx={{ flex: 1 }}
        />
      </Stack>
      
      <Stack direction="row" spacing={2} alignItems="center">
        <TextField
          label="灏侀潰鍥剧墖URL"
          value={coverUrl}
          onChange={(e) => setCoverUrl(e.target.value)}
          size="small"
          sx={{ flex: 1 }}
          placeholder="https://example.com/image.jpg"
        />
        <Typography sx={{ color: '#999' }}>鎴?/Typography>
        <Button
          variant="outlined"
          component="label"
          size="small"
          startIcon={<Upload />}
          disabled={uploadingCover}
        >
          {uploadingCover ? '涓婁紶涓?..' : '涓婁紶鍥剧墖'}
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={handleImageUpload}
          />
        </Button>
      </Stack>
      
      <Stack direction="row" spacing={2}>
        <TextField
          label="鍙拌瘝/姝岃瘝"
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          size="small"
          sx={{ flex: 1 }}
          multiline
          maxRows={2}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ color: '#999', fontSize: '0.8rem' }}>棰滆壊:</Typography>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{ width: 40, height: 30, border: 'none', cursor: 'pointer' }}
          />
        </Box>
      </Stack>
      
      {coverUrl && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 60,
              height: 80,
              borderRadius: 1,
              background: `url(${coverUrl}) center/cover`,
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          />
          <Typography sx={{ color: '#999', fontSize: '0.8rem' }}>灏侀潰棰勮</Typography>
        </Box>
      )}
      
      <Button
        variant="contained"
        onClick={handleAddCard}
        startIcon={<Add />}
        sx={{
          background: 'linear-gradient(45deg, #4ade80, #22c55e)',
          '&:hover': {
            background: 'linear-gradient(45deg, #22c55e, #16a34a)',
          },
        }}
      >
        娣诲姞鑷畾涔夊崱鐗?
      </Button>
    </Stack>
  );
}

export default function GamePage() {
  const characterMap = useRef<CharacterConfigMap>(getAnimeConfigMap());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const failAudioRef = useRef<HTMLAudioElement | null>(null);
  
  const [roomState, setRoomState] = useState<RoomState>({
    roomId: '',
    hostId: 0,
    players: [],
    gameMode: GameMode.AutoRandom,
    gamePhase: GamePhase.Lobby,
    currentCharacterId: null,
    currentQuote: null,
    turnStartTime: null,
    pickEvents: [],
    deckRows: 3,
    deckColumns: 8,
    playbackSetting: {
      countdown: false,
      randomStartPosition: false,
      playbackDuration: 0,
    },
    paused: false,
    pausedTimeRemaining: 0,
    customCards: [],
    deckType: 'anime2026',
    deckCards: [],
    currentTurnPicks: [],
    createdAt: Date.now(),
  });
  
  const [myPlayerId, setMyPlayerId] = useState<string | number>(0);
  const [playerName, setPlayerName] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState<string>('');
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showJudgeMenu, setShowJudgeMenu] = useState(false);
  const [showSaveDeckDialog, setShowSaveDeckDialog] = useState(false);
  const [showGlobalDecksDialog, setShowGlobalDecksDialog] = useState(false);
  const [globalDecks, setGlobalDecks] = useState<GlobalDeck[]>([]);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDescription, setNewDeckDescription] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(0);
  const [turnTimer, setTurnTimer] = useState<number>(60);
  const [deckCards, setDeckCards] = useState<CharacterConfig[]>([]);
  const [selectedCard, setSelectedCard] = useState<CharacterConfig | null>(null);
  const [volume, setVolume] = useState<number>(0.7);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'lobby' | 'room' | 'profile' | 'guessSong' | 'songLibrary'>('lobby');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [roomsList, setRoomsList] = useState<RoomInfo[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<'anime2026' | 'custom'>('anime2026');
  const [testBotInterval, setTestBotInterval] = useState<NodeJS.Timeout | null>(null);
  const [connectionNotice, setConnectionNotice] = useState<{
    severity: 'info' | 'warning' | 'error';
    title: string;
    lines: string[];
  } | null>(null);
  const [guestSessionReady, setGuestSessionReady] = useState(false);
  const [guestSessionPending, setGuestSessionPending] = useState(false);
  const [roomSyncStatus, setRoomSyncStatus] = useState<'idle' | 'connecting' | 'live' | 'local'>('idle');
  const [chatSyncStatus, setChatSyncStatus] = useState<'idle' | 'connecting' | 'live' | 'local'>('idle');
  
  const myPlayer = roomState.players.find(p => p.id === myPlayerId);
  const isHost = myPlayer?.isHost ?? false;
  const currentCharacter = roomState.currentCharacterId
    ? characterMap.current.get(roomState.currentCharacterId)
    : null;
  const readyPlayerCount = roomState.players.filter((player) => !player.isObserver && player.isReady).length;
  const activePlayerCount = roomState.players.filter((player) => !player.isObserver).length;
  const observerCount = roomState.players.filter((player) => player.isObserver).length;
  const isLikelyGuestUser = useMemo(() => {
    if (!userProfile) return true;
    return !userProfile.bio && (userProfile.displayName.startsWith('娓稿') || !!userProfile.id);
  }, [userProfile]);
  const inviteUrl = useMemo(() => {
    if (!roomState.roomId) return '';
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '');
    if (!baseUrl) return '';

    const url = new URL(baseUrl);
    url.searchParams.set('room', roomState.roomId);
    return url.toString();
  }, [roomState.roomId]);
  
  const playSound = useCallback((type: 'success' | 'fail') => {
    if (isMuted) return;
    const audio = type === 'success' ? successAudioRef.current : failAudioRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.volume = volume;
      audio.play().catch(() => {});
    }
  }, [isMuted, volume]);
  
  const showComboPopup = useCallback((combo: number) => {
    const popup = document.createElement('div');
    popup.className = 'combo-popup';
    popup.textContent = `${combo}杩炲嚮锛乣;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 800);
  }, []);
  
  const showPointsPopup = useCallback((points: number, x: number, y: number) => {
    const popup = document.createElement('div');
    popup.className = 'points-popup';
    popup.textContent = `+${points}`;
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1000);
  }, []);
  
  const throwEgg = useCallback((targetId: number) => {
    const egg = document.createElement('div');
    egg.className = 'egg-animation';
    egg.textContent = '馃';
    egg.style.left = '50%';
    egg.style.top = '50%';
    egg.style.setProperty('--throw-x', `${(Math.random() - 0.5) * 200}px`);
    egg.style.setProperty('--throw-y', `${-100 - Math.random() * 100}px`);
    document.body.appendChild(egg);
    setTimeout(() => egg.remove(), 1000);
  }, []);

  const showConnectionNotice = useCallback((
    severity: 'info' | 'warning' | 'error',
    title: string,
    lines: string[],
  ) => {
    setConnectionNotice({ severity, title, lines });
  }, []);

  const describeSupabaseFailure = useCallback(async (action: 'create' | 'join', error?: unknown) => {
    const diagnostic: SupabaseRoomDiagnostic = await roomService.diagnoseSupabaseRoomAccess();
    const actionLabel = action === 'create' ? '鍒涘缓鎴块棿' : '鍔犲叆鎴块棿';
    const errorMessage =
      error instanceof Error ? error.message :
      typeof error === 'string' ? error :
      '';

    showConnectionNotice('error', `${actionLabel}澶辫触`, [
      `${actionLabel}褰撳墠璧扮殑鏄?Supabase 鑱旀満妯″紡銆俙,
      diagnostic.summary,
      ...(errorMessage ? [`杩愯鏃堕敊璇? ${errorMessage}`] : []),
      ...diagnostic.details,
      '濡傛灉浣犳鍦ㄥ垵濮嬪寲杩滅搴擄紝璇峰厛鎵ц SUPABASE_SETUP.md 閲岀殑 schema.sql锛岀劧鍚庡埛鏂伴〉闈㈠啀璇曘€?,
    ]);
  }, [showConnectionNotice]);
  
  useEffect(() => {
    const refreshRoomsList = async () => {
      if (isSupabaseConfigured()) {
        const rooms = await roomService.getRooms();
        setRoomsList(rooms.map(room => ({
          roomId: room.code,
          hostName: room.hostName,
          playerCount: room.playerCount,
          phase: room.gamePhase,
          gameMode: room.gameMode,
          createdAt: room.createdAt ? new Date(room.createdAt).getTime() : Date.now(),
        })));
      } else {
        setRoomsList(roomSync.getRoomsList());
      }
    };
    
    refreshRoomsList();
    const interval = setInterval(refreshRoomsList, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    const profile = userProfileService.getProfile();
    setUserProfile(profile);
    setPlayerName(profile.displayName);
    
    const savedRoomCode = localStorage.getItem('karuta_room_code');
    const savedPlayerId = localStorage.getItem('karuta_player_id');
    
    if (savedRoomCode && savedPlayerId) {
      setMyPlayerId(savedPlayerId);
      
      if (isSupabaseConfigured()) {
        roomService.getRoomByCode(savedRoomCode).then(async (room) => {
          if (room && room.gamePhase !== GamePhase.GameEnd) {
            const existingPlayer = room.players.find(p => String(p.id) === savedPlayerId);
            if (existingPlayer) {
              setRoomState({
                roomId: room.code,
                hostId: 0,
                players: room.players.map(p => ({
                  id: p.id,
                  name: p.name,
                  avatar: p.avatar || undefined,
                  isHost: p.isHost,
                  isObserver: p.isObserver,
                  isLocked: p.isLocked,
                  isReady: p.isReady,
                  score: p.score,
                  combo: p.combo,
                  maxCombo: p.maxCombo,
                  correctCount: p.correctCount,
                  wrongCount: p.wrongCount,
                  totalReactionTime: p.totalReactionTime,
                  deck: p.deck || [],
                  collected: p.collected || [],
                  seatIndex: p.seatIndex,
                })),
                gameMode: room.gameMode as GameMode,
                gamePhase: room.gamePhase as GamePhase,
                currentCharacterId: room.currentCharacterId,
                currentQuote: room.currentQuote,
                turnStartTime: room.turnStartTime ? new Date(room.turnStartTime).getTime() : null,
                pickEvents: [],
                deckRows: 3,
                deckColumns: 8,
                playbackSetting: {
                  countdown: false,
                  randomStartPosition: false,
                  playbackDuration: 0,
                },
                paused: room.paused,
                pausedTimeRemaining: room.pausedTimeRemaining,
                customCards: room.customCards || [],
                deckType: room.deckType === 'custom' ? 'custom' : 'anime2026',
                deckCards: room.deckCards || [],
                currentTurnPicks: room.currentTurnPicks || [],
                createdAt: new Date(room.createdAt).getTime(),
              });
              setViewMode('room');
              
              if (room.deckCards && room.deckCards.length > 0) {
                setDeckCards(room.deckCards as CharacterConfig[]);
              }
            } else {
              localStorage.removeItem('karuta_room_code');
              localStorage.removeItem('karuta_player_id');
              setMyPlayerId(generatePlayerId());
            }
          } else {
            localStorage.removeItem('karuta_room_code');
            localStorage.removeItem('karuta_player_id');
            setMyPlayerId(generatePlayerId());
          }
        });
      } else {
        const localRoom = roomSync.getRoom(savedRoomCode);
        if (localRoom) {
          const existingPlayer = localRoom.players.find(p => String(p.id) === savedPlayerId);
          if (existingPlayer) {
            setRoomState(localRoom);
            setViewMode('room');
          }
        }
        setMyPlayerId(generatePlayerId());
      }
    } else {
      setMyPlayerId(generatePlayerId());
    }
    
    setGlobalDecks(globalDeckService.getDecks());
    void globalDeckService.syncWithCloud()
      .then((decks) => setGlobalDecks(decks))
      .catch((error) => console.error('Failed to sync global decks:', error));
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (roomState.roomId) return;

    const params = new URLSearchParams(window.location.search);
    const roomFromLink = params.get('room')?.trim().toUpperCase();
    if (!roomFromLink) return;

    setJoinRoomId(roomFromLink);
    setShowJoinDialog(true);
    showConnectionNotice('info', '宸茶瘑鍒個璇烽摼鎺?, [
      `妫€娴嬪埌鎴块棿鍙?${roomFromLink}銆俙,
      '纭鏄电О鍚庯紝鐐光€滃姞鍏ユ父鎴忊€濇垨鈥滄梺瑙傗€濆氨鑳界洿鎺ヨ繘鍏ャ€?,
    ]);
  }, [roomState.roomId, showConnectionNotice]);
  
  useEffect(() => {
    if (!roomState.roomId) return;

    if (isSupabaseConfigured()) {
      setRoomSyncStatus('connecting');
      const unsubscribe = roomService.subscribeToRoom(roomState.roomId, async (room) => {
        setRoomSyncStatus('live');
        if (!room) {
          setRoomState({
            roomId: '',
            hostId: 0,
            players: [],
            gameMode: GameMode.AutoRandom,
            gamePhase: GamePhase.Lobby,
            currentCharacterId: null,
            currentQuote: null,
            turnStartTime: null,
            pickEvents: [],
            deckRows: 3,
            deckColumns: 8,
            playbackSetting: {
              countdown: false,
              randomStartPosition: false,
              playbackDuration: 0,
            },
            paused: false,
            pausedTimeRemaining: 0,
            customCards: [],
            deckType: 'anime2026',
            deckCards: [],
            currentTurnPicks: [],
            createdAt: Date.now(),
          });
          setViewMode('lobby');
          const rooms = await roomService.getRooms();
          setRoomsList(rooms.map(r => ({
            roomId: r.code,
            hostName: r.hostName,
            playerCount: r.playerCount,
            phase: r.gamePhase,
            gameMode: r.gameMode,
            createdAt: r.createdAt ? new Date(r.createdAt).getTime() : Date.now(),
          })));
          return;
        }
        
        setRoomState({
          roomId: room.code,
          hostId: 0,
          players: room.players.map(p => ({
            id: p.id,
            name: p.name,
            avatar: p.avatar || undefined,
            isHost: p.isHost,
            isObserver: p.isObserver,
            isLocked: p.isLocked,
            isReady: p.isReady,
            score: p.score,
            combo: p.combo,
            maxCombo: p.maxCombo,
            correctCount: p.correctCount,
            wrongCount: p.wrongCount,
            totalReactionTime: p.totalReactionTime,
            deck: p.deck || [],
            collected: p.collected || [],
            seatIndex: p.seatIndex,
          })),
          gameMode: room.gameMode as GameMode,
          gamePhase: room.gamePhase as GamePhase,
          currentCharacterId: room.currentCharacterId,
          currentQuote: room.currentQuote,
          turnStartTime: room.turnStartTime ? new Date(room.turnStartTime).getTime() : null,
          pickEvents: [],
          deckRows: 3,
          deckColumns: 8,
          playbackSetting: {
            countdown: false,
            randomStartPosition: false,
            playbackDuration: 0,
          },
          paused: room.paused,
          pausedTimeRemaining: room.pausedTimeRemaining,
          customCards: room.customCards || [],
          deckType: room.deckType === 'custom' ? 'custom' : 'anime2026',
          deckCards: room.deckCards || [],
          currentTurnPicks: room.currentTurnPicks || [],
          createdAt: new Date(room.createdAt).getTime(),
        });
        
        if (room.deckCards && room.deckCards.length > 0) {
          setDeckCards(room.deckCards as CharacterConfig[]);
        }
      });
      return () => unsubscribe();
    } else {
      setRoomSyncStatus('local');
      const unsubscribe = roomSync.subscribe(roomState.roomId, (event) => {
        if (event.type === 'ROOM_UPDATED' || event.type === 'PLAYER_JOINED' || event.type === 'PLAYER_READY') {
          if ((event.payload as any)?.deleted) {
            setRoomState({
              roomId: '',
              hostId: 0,
              players: [],
              gameMode: GameMode.AutoRandom,
              gamePhase: GamePhase.Lobby,
              currentCharacterId: null,
              currentQuote: null,
              turnStartTime: null,
              pickEvents: [],
              deckRows: 3,
              deckColumns: 8,
              playbackSetting: {
                countdown: false,
                randomStartPosition: false,
                playbackDuration: 0,
              },
              paused: false,
              pausedTimeRemaining: 0,
              customCards: [],
              deckType: 'anime2026',
              deckCards: [],
              currentTurnPicks: [],
              createdAt: Date.now(),
            });
            setViewMode('lobby');
            setRoomsList(roomSync.getRoomsList());
            return;
          }
          
          const updatedRoom = roomSync.getRoom(roomState.roomId);
          if (updatedRoom) {
            setRoomState(updatedRoom);
          }
        }
      });
      return () => unsubscribe();
    }
  }, [roomState.roomId]);
  
  useEffect(() => {
    if (roomState.gamePhase === GamePhase.Playing && roomState.deckCards.length > 0 && deckCards.length === 0) {
      setDeckCards(roomState.deckCards as CharacterConfig[]);
    }
  }, [roomState.gamePhase, roomState.deckCards, deckCards.length]);
  
  const createRoom = useCallback(async () => {
    const guestSetup = await ensureGuestSessionForOnlinePlay();
    if (!guestSetup.ok) {
      return;
    }

    const effectivePlayerName = guestSetup.displayName;
    const effectiveAvatar = guestSetup.profile.avatar || userProfile?.avatar;

    if (isSupabaseConfigured()) {
      try {
        const room = await roomService.createRoom(effectivePlayerName, selectedDeck);
        if (room) {
          setConnectionNotice(null);
          setRoomState({
            roomId: room.code,
            hostId: 0,
            players: room.players.map(p => ({
              id: p.id,
              name: p.name,
              avatar: p.avatar || undefined,
              isHost: p.isHost,
              isObserver: p.isObserver,
              isLocked: p.isLocked,
              isReady: p.isReady,
              score: p.score,
              combo: p.combo,
              maxCombo: p.maxCombo,
              correctCount: p.correctCount,
              wrongCount: p.wrongCount,
              totalReactionTime: p.totalReactionTime,
              deck: p.deck || [],
              collected: p.collected || [],
              seatIndex: p.seatIndex,
            })),
            gameMode: room.gameMode as GameMode,
            gamePhase: room.gamePhase as GamePhase,
            currentCharacterId: room.currentCharacterId,
            currentQuote: room.currentQuote,
            turnStartTime: room.turnStartTime ? new Date(room.turnStartTime).getTime() : null,
            pickEvents: [],
            deckRows: 3,
            deckColumns: 8,
            playbackSetting: {
              countdown: false,
              randomStartPosition: false,
              playbackDuration: 0,
            },
            paused: room.paused,
            pausedTimeRemaining: room.pausedTimeRemaining,
            customCards: room.customCards || [],
            deckType: room.deckType === 'custom' ? 'custom' : 'anime2026',
            deckCards: room.deckCards || [],
            currentTurnPicks: [],
            createdAt: new Date(room.createdAt).getTime(),
          });
          setMyPlayerId(room.players[0]?.id || 0);
          
          localStorage.setItem('karuta_room_code', room.code);
          localStorage.setItem('karuta_player_id', String(room.players[0]?.id || ''));
          
          setViewMode('room');
        } else {
          await describeSupabaseFailure('create');
        }
      } catch (error) {
        console.error('Failed to create room:', error);
        await describeSupabaseFailure('create', error);
        alert('鍒涘缓鎴块棿澶辫触锛?);
      }
    } else {
      setConnectionNotice(null);
      const roomId = generateRoomId();
      const playerId = generatePlayerId();
      const newPlayer: PlayerInfo = {
        id: playerId,
        name: effectivePlayerName,
        avatar: effectiveAvatar,
        isHost: true,
        isObserver: false,
        isLocked: false,
        isReady: true,
        score: 0,
        combo: 0,
        maxCombo: 0,
        correctCount: 0,
        wrongCount: 0,
        totalReactionTime: 0,
        deck: [],
        collected: [],
        seatIndex: 0,
      };
      
      const newRoomState: RoomState = {
        roomId,
        hostId: playerId,
        players: [newPlayer],
        gameMode: GameMode.AutoRandom,
        gamePhase: GamePhase.Lobby,
        currentCharacterId: null,
        currentQuote: null,
        turnStartTime: null,
        pickEvents: [],
        deckRows: 3,
        deckColumns: 8,
        playbackSetting: {
          countdown: false,
          randomStartPosition: false,
          playbackDuration: 0,
        },
        paused: false,
        pausedTimeRemaining: 0,
        customCards: [],
        deckType: selectedDeck,
        deckCards: [],
        currentTurnPicks: [],
        createdAt: Date.now(),
      };
      
      roomSync.createRoom(newRoomState);
      
      localStorage.setItem('karuta_room_code', newRoomState.roomId);
      localStorage.setItem('karuta_player_id', String(playerId));
      
      setRoomState(newRoomState);
      setMyPlayerId(playerId);
      setViewMode('room');
    }
  }, [ensureGuestSessionForOnlinePlay, selectedDeck, userProfile?.avatar]);
  
  const joinRoom = useCallback(async (roomId: string, asObserver: boolean = false) => {
    const trimmedRoomId = roomId.trim().toUpperCase();
    
    if (!trimmedRoomId) {
      alert('璇疯緭鍏ユ埧闂村彿锛?);
      return;
    }
    
    const guestSetup = await ensureGuestSessionForOnlinePlay();
    if (!guestSetup.ok) {
      return;
    }

    const effectivePlayerName = guestSetup.displayName;
    const effectiveAvatar = guestSetup.profile.avatar || userProfile?.avatar;

    if (isSupabaseConfigured()) {
      try {
        const room = await roomService.joinRoom(trimmedRoomId, effectivePlayerName, asObserver);
        if (room) {
          setRoomState({
            roomId: room.code,
            hostId: 0,
            players: room.players.map(p => ({
              id: p.id,
              name: p.name,
              avatar: p.avatar || undefined,
              isHost: p.isHost,
              isObserver: p.isObserver,
              isLocked: p.isLocked,
              isReady: p.isReady,
              score: p.score,
              combo: p.combo,
              maxCombo: p.maxCombo,
              correctCount: p.correctCount,
              wrongCount: p.wrongCount,
              totalReactionTime: p.totalReactionTime,
              deck: p.deck || [],
              collected: p.collected || [],
              seatIndex: p.seatIndex,
            })),
            gameMode: room.gameMode as GameMode,
            gamePhase: room.gamePhase as GamePhase,
            currentCharacterId: room.currentCharacterId,
            currentQuote: room.currentQuote,
            turnStartTime: room.turnStartTime ? new Date(room.turnStartTime).getTime() : null,
            pickEvents: [],
            deckRows: 3,
            deckColumns: 8,
            playbackSetting: {
              countdown: false,
              randomStartPosition: false,
              playbackDuration: 0,
            },
            paused: room.paused,
            pausedTimeRemaining: room.pausedTimeRemaining,
            customCards: room.customCards || [],
            deckType: room.deckType === 'custom' ? 'custom' : 'anime2026',
            deckCards: room.deckCards || [],
            currentTurnPicks: [],
            createdAt: new Date(room.createdAt).getTime(),
          });
          const myPlayer = room.players.find(p => p.name === effectivePlayerName);
          setMyPlayerId(myPlayer?.id || 0);
          
          localStorage.setItem('karuta_room_code', room.code);
          localStorage.setItem('karuta_player_id', String(myPlayer?.id || ''));
          
          setViewMode('room');
          setShowJoinDialog(false);
          setJoinRoomId('');
        } else {
          await describeSupabaseFailure('join');
          alert('鎴块棿涓嶅瓨鍦紒璇锋鏌ユ埧闂村彿鏄惁姝ｇ‘銆?);
        }
      } catch (error) {
        console.error('Failed to join room:', error);
        await describeSupabaseFailure('join', error);
        alert('鍔犲叆鎴块棿澶辫触锛?);
      }
    } else {
      setConnectionNotice(null);
      const existingRoom = roomSync.getRoom(trimmedRoomId);
      if (!existingRoom) {
        alert('鎴块棿涓嶅瓨鍦紒璇锋鏌ユ埧闂村彿鏄惁姝ｇ‘銆?);
        return;
      }
      
      const playerId = generatePlayerId();
      const newPlayer: PlayerInfo = {
        id: playerId,
        name: effectivePlayerName,
        avatar: effectiveAvatar,
        isHost: false,
        isObserver: asObserver,
        isLocked: false,
        isReady: asObserver,
        score: 0,
        combo: 0,
        maxCombo: 0,
        correctCount: 0,
        wrongCount: 0,
        totalReactionTime: 0,
        deck: [],
        collected: [],
        seatIndex: 0,
      };
      
      const updatedRoom = roomSync.joinRoom(trimmedRoomId, newPlayer);
      
      if (!updatedRoom) {
        alert('鍔犲叆鎴块棿澶辫触锛?);
        return;
      }
      
      localStorage.setItem('karuta_room_code', trimmedRoomId);
      localStorage.setItem('karuta_player_id', String(playerId));
      
      setRoomState(updatedRoom);
      setMyPlayerId(playerId);
      setViewMode('room');
      setShowJoinDialog(false);
      setJoinRoomId('');
    }
  }, [ensureGuestSessionForOnlinePlay, userProfile?.avatar]);
  
  const endGame = useCallback(async () => {
    const updatedRoom = {
      ...roomState,
      gamePhase: GamePhase.GameEnd,
      gameEndedAt: Date.now(),
    };
    
    if (isSupabaseConfigured()) {
      await roomService.updateRoomState(roomState.roomId, {
        gamePhase: GamePhase.GameEnd,
        gameEndedAt: new Date().toISOString(),
      });
    } else {
      roomSync.updateRoom(updatedRoom);
    }
    setRoomState(updatedRoom);
  }, [roomState]);
  
  const nextTurn = useCallback(async (currentDeck?: CharacterConfig[], newRoomState?: RoomState) => {
    const deck = currentDeck || deckCards;
    if (deck.length === 0) {
      endGame();
      return;
    }
    
    const randomIndex = Math.floor(Math.random() * deck.length);
    const character = deck[randomIndex];
    const quote = getRandomAnimeQuote({
      id: character.id,
      quotes: character.quotes
    } as any);
    
    const baseState = newRoomState || roomState;
    const updatedRoom = {
      ...baseState,
      currentCharacterId: character.id,
      currentQuote: quote,
      turnStartTime: Date.now(),
      paused: false,
    };
    
    if (isSupabaseConfigured()) {
      await roomService.updateRoomState(baseState.roomId, {
        currentCharacterId: character.id,
        currentQuote: quote,
        turnStartTime: new Date().toISOString(),
        paused: false,
      });
    } else {
      roomSync.updateRoom(updatedRoom);
    }
    
    setRoomState(updatedRoom);
    
    setTurnTimer(60);
    setSelectedCard(null);
  }, [deckCards, roomState, endGame]);
  
  const startGame = useCallback(async () => {
    const allReady = roomState.players.every(p => p.isReady || p.isObserver);
    if (!allReady) {
      alert('杩樻湁鐜╁鏈噯澶囷紒');
      return;
    }
    
    let allCharacters: CharacterConfig[] = [];
    
    if (roomState.deckType === 'custom' && roomState.customCards.length > 0) {
      const customCharacters = roomState.customCards.map(card => ({
        id: card.id,
        name: card.name,
        anime: card.anime,
        emoji: '馃幀',
        card: [`${card.id}-1`],
        quotes: card.quotes,
        color: card.color,
        coverImage: card.coverImage,
        coverImageMedium: card.coverImage,
      }));
      allCharacters = customCharacters;
    } else {
      allCharacters = getCharacterDataFromAnime();
    }
    
    if (allCharacters.length === 0) {
      alert('娌℃湁鍙敤鐨勫崱鐗岋紒');
      return;
    }
    
    const shuffledCharacters = shuffleArray([...allCharacters]).slice(0, roomState.deckRows * roomState.deckColumns);
    setDeckCards(shuffledCharacters);
    
    const deckCardsData = shuffledCharacters.map(c => ({
      id: c.id,
      name: c.name,
      anime: c.anime,
      emoji: c.emoji,
      card: c.card,
      quotes: c.quotes,
      color: c.color,
      coverImage: c.coverImage,
      coverImageMedium: c.coverImageMedium,
    }));
    
    const updatedRoom = {
      ...roomState,
      gamePhase: GamePhase.Playing,
      paused: false,
      deckCards: deckCardsData,
    };
    
    if (isSupabaseConfigured()) {
      await roomService.updateRoomState(roomState.roomId, {
        gamePhase: GamePhase.Playing,
        paused: false,
        deckCards: deckCardsData,
      });
    } else {
      roomSync.updateRoom(updatedRoom);
    }
    
    setRoomState(updatedRoom);
    
    nextTurn(shuffledCharacters, updatedRoom);
  }, [roomState, nextTurn]);
  
  const toggleReady = useCallback(async () => {
    const newReadyState = !myPlayer?.isReady;
    
    if (isSupabaseConfigured()) {
      await roomService.updatePlayerReady(myPlayerId, newReadyState);
    } else {
      const updatedRoom = roomSync.toggleReady(roomState.roomId, Number(myPlayerId));
      if (updatedRoom) {
        setRoomState(updatedRoom);
      }
    }
  }, [roomState.roomId, myPlayerId, myPlayer?.isReady]);
  
  const leaveRoom = useCallback(() => {
    roomSync.leaveRoom(roomState.roomId, Number(myPlayerId));
    
    localStorage.removeItem('karuta_room_code');
    localStorage.removeItem('karuta_player_id');
    
    setRoomState({
      roomId: '',
      hostId: 0,
      players: [],
      gameMode: GameMode.AutoRandom,
      gamePhase: GamePhase.Lobby,
      currentCharacterId: null,
      currentQuote: null,
      turnStartTime: null,
      pickEvents: [],
      deckRows: 3,
      deckColumns: 8,
      playbackSetting: {
        countdown: false,
        randomStartPosition: false,
        playbackDuration: 0,
      },
      paused: false,
      pausedTimeRemaining: 0,
      customCards: [],
      deckType: 'anime2026',
      deckCards: [],
      currentTurnPicks: [],
      createdAt: Date.now(),
    });
    setViewMode('lobby');
    setRoomsList(roomSync.getRoomsList());
  }, [roomState.roomId, myPlayerId]);
  
  const addCustomCard = useCallback((card: CustomCard) => {
    setRoomState(prev => {
      const updatedRoom = { 
        ...prev, 
        customCards: [...prev.customCards, card],
        deckType: 'custom' as const,
      };
      roomSync.updateRoom(updatedRoom);
      return updatedRoom;
    });
  }, []);
  
  const removeCustomCard = useCallback((cardId: string) => {
    setRoomState(prev => {
      const updatedRoom = { 
        ...prev, 
        customCards: prev.customCards.filter(c => c.id !== cardId),
        deckType: (prev.customCards.length <= 1 ? 'anime2026' : 'custom') as 'anime2026' | 'custom',
      };
      roomSync.updateRoom(updatedRoom);
      return updatedRoom;
    });
  }, []);
  
  const saveCurrentDeck = useCallback(async () => {
    if (roomState.customCards.length === 0) {
      alert('娌℃湁鍙繚瀛樼殑鑷畾涔夊崱鐗岋紒');
      return;
    }
    if (!newDeckName.trim()) {
      alert('璇疯緭鍏ョ墝缁勫悕绉帮紒');
      return;
    }
    
    try {
      await globalDeckService.saveDeckAsync({
        name: newDeckName.trim(),
        description: newDeckDescription.trim(),
        cards: roomState.customCards,
        createdBy: playerName,
      });
      
      setNewDeckName('');
      setNewDeckDescription('');
      setShowSaveDeckDialog(false);
      setGlobalDecks(globalDeckService.getDecks());
      alert('鐗岀粍淇濆瓨鎴愬姛锛?);
    } catch (error) {
      alert(`鐗岀粍淇濆瓨澶辫触锛?{error instanceof Error ? error.message : '璇风◢鍚庨噸璇?}`);
    }
  }, [roomState.customCards, newDeckName, newDeckDescription, playerName]);
  
  const loadGlobalDeck = useCallback((deck: GlobalDeck) => {
    const updatedRoom = {
      ...roomState,
      customCards: deck.cards,
      deckType: 'custom' as const,
    };
    roomSync.updateRoom(updatedRoom);
    setRoomState(updatedRoom);
    void globalDeckService.incrementPlayCountAsync(deck.id);
    setShowGlobalDecksDialog(false);
  }, [roomState]);
  
  const deleteGlobalDeck = useCallback(async (deckId: string) => {
    if (confirm('纭畾瑕佸垹闄よ繖涓墝缁勫悧锛?)) {
      try {
        await globalDeckService.deleteDeckAsync(deckId);
        setGlobalDecks(globalDeckService.getDecks());
      } catch (error) {
        alert(`鍒犻櫎鐗岀粍澶辫触锛?{error instanceof Error ? error.message : '璇风◢鍚庨噸璇?}`);
      }
    }
  }, []);

  function syncProfileToLobby(displayName: string, authUser?: { id?: string; avatar?: string | null; bio?: string | null }) {
    const updatedProfile = userProfileService.updateProfile({
      ...(authUser?.id ? { id: authUser.id } : {}),
      displayName,
      ...(authUser?.avatar !== undefined ? { avatar: authUser.avatar || '' } : {}),
      ...(authUser?.bio !== undefined ? { bio: authUser.bio || '' } : {}),
    });
    setUserProfile(updatedProfile);
    setPlayerName(updatedProfile.displayName);
    return updatedProfile;
  }

  async function ensureGuestSessionForOnlinePlay(requestedName?: string) {
    const fallbackName = `娓稿${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const effectiveName = (requestedName ?? playerName).trim().slice(0, 12) || fallbackName;
    const localProfile = syncProfileToLobby(effectiveName);

    if (!isSupabaseConfigured()) {
      setGuestSessionReady(true);
      return {
        ok: true as const,
        profile: localProfile,
        displayName: effectiveName,
      };
    }

    setGuestSessionPending(true);
    try {
      const result = await authService.ensureGuestSession(effectiveName);
      if (!result.success || !result.user) {
        setGuestSessionReady(false);
        showConnectionNotice('warning', '娓稿韬唤灏嗕互涓存椂妯″紡杩愯', [
          '鑱旀満浠嶇劧鍙互缁х画锛屾埧闂淬€佽亰澶╁拰閫夌墝鍚屾涓嶄細鍙楀奖鍝嶃€?,
          '鍙槸涓汉璧勬枡銆佺墝缁勫拰姝屾洸搴撲笉浼氱粦瀹氬埌浜戠璐﹀彿銆?,
          result.error || '鍖垮悕娓稿鐧诲綍澶辫触锛岃绋嶅悗閲嶈瘯銆?,
        ]);
        return {
          ok: true as const,
          displayName: effectiveName,
          profile: localProfile,
        };
      }

      const syncedProfile = syncProfileToLobby(effectiveName, {
        id: result.user.id,
        avatar: result.user.avatar,
        bio: result.user.bio,
      });
      setGuestSessionReady(true);
      setConnectionNotice((prev) => prev?.title === '娓稿韬唤灏嗕互涓存椂妯″紡杩愯' ? null : prev);

      return {
        ok: true as const,
        profile: syncedProfile,
        displayName: effectiveName,
      };
    } finally {
      setGuestSessionPending(false);
    }
  }
  
  const handleCardClick = useCallback(async (character: CharacterConfig) => {
    if (selectedCard || roomState.gamePhase !== GamePhase.Playing || roomState.paused) return;
    if (myPlayer?.isObserver) return;
    
    const reactionTime = roomState.turnStartTime ? Date.now() - roomState.turnStartTime : 0;
    const isCorrect = character.id === roomState.currentCharacterId;
    
    setSelectedCard(character);
    
    const newPick = {
      playerId: myPlayerId,
      cardId: character.id,
      isCorrect,
      reactionTime,
    };
    
    const updatedRoom = {
      ...roomState,
      currentTurnPicks: [...roomState.currentTurnPicks, newPick],
    };
    
    if (isCorrect) {
      playSound('success');
      
      const basePoints = 100;
      const comboBonus = (myPlayer?.combo || 0) * 10;
      const speedBonus = Math.max(0, Math.floor((60000 - reactionTime) / 1000));
      const totalPoints = basePoints + comboBonus + speedBonus;
      
      const newCombo = (myPlayer?.combo || 0) + 1;
      if (newCombo >= 3) showComboPopup(newCombo);
      
      updatedRoom.players = updatedRoom.players.map(p => {
        if (p.id === myPlayerId) {
          return {
            ...p,
            score: p.score + totalPoints,
            combo: newCombo,
            maxCombo: Math.max(p.maxCombo, newCombo),
            correctCount: p.correctCount + 1,
            totalReactionTime: p.totalReactionTime + reactionTime,
          };
        }
        return p;
      });
      
      updatedRoom.pickEvents = [...updatedRoom.pickEvents, {
        timestamp: Date.now(),
        playerId: myPlayerId,
        cardInfo: new CardInfo(character.id, 0),
        reactionTime,
        isCorrect: true,
      }];
      
      if (isSupabaseConfigured()) {
        await roomService.recordPickEvent(roomState.roomId, myPlayerId, character.id, true, reactionTime);
        await roomService.updatePlayerState(myPlayerId, {
          score: (myPlayer?.score || 0) + totalPoints,
          combo: newCombo,
          maxCombo: Math.max(myPlayer?.maxCombo || 0, newCombo),
          correctCount: (myPlayer?.correctCount || 0) + 1,
          totalReactionTime: (myPlayer?.totalReactionTime || 0) + reactionTime,
        });
      } else {
        roomSync.updateRoom(updatedRoom);
      }
      setRoomState(updatedRoom);
      
      setTimeout(async () => {
        const newDeck = deckCards.filter(c => c.id !== character.id);
        setDeckCards(newDeck);
        
        const deckCardsData = newDeck.map(c => ({
          id: c.id,
          name: c.name,
          anime: c.anime,
          emoji: c.emoji,
          card: c.card,
          quotes: c.quotes,
          color: c.color,
          coverImage: c.coverImage,
          coverImageMedium: c.coverImageMedium,
        }));
        
        if (newDeck.length === 0) {
          if (isSupabaseConfigured()) {
            await roomService.updateRoomState(roomState.roomId, {
              gamePhase: GamePhase.GameEnd,
              gameEndedAt: new Date().toISOString(),
            });
          }
          endGame();
          return;
        }
        
        const randomIndex = Math.floor(Math.random() * newDeck.length);
        const nextCharacter = newDeck[randomIndex];
        const nextQuote = getRandomAnimeQuote({
          id: nextCharacter.id,
          quotes: nextCharacter.quotes
        } as any);
        
        if (isSupabaseConfigured()) {
          await roomService.updateRoomState(roomState.roomId, {
            deckCards: deckCardsData,
            currentCharacterId: nextCharacter.id,
            currentQuote: nextQuote,
            turnStartTime: new Date().toISOString(),
            paused: false,
          });
        } else {
          const finalRoom = {
            ...updatedRoom,
            deckCards: deckCardsData,
            currentCharacterId: nextCharacter.id,
            currentQuote: nextQuote,
            turnStartTime: Date.now(),
            paused: false,
            currentTurnPicks: [],
          };
          roomSync.updateRoom(finalRoom);
        }
        
        setRoomState(prev => ({
          ...prev,
          deckCards: deckCardsData,
          currentCharacterId: nextCharacter.id,
          currentQuote: nextQuote,
          turnStartTime: Date.now(),
          paused: false,
          currentTurnPicks: [],
        }));
        
        setTurnTimer(60);
        setSelectedCard(null);
      }, 1500);
    } else {
      playSound('fail');
      
      updatedRoom.players = updatedRoom.players.map(p => {
        if (p.id === myPlayerId) {
          return {
            ...p,
            combo: 0,
            wrongCount: p.wrongCount + 1,
            isLocked: true,
          };
        }
        return p;
      });
      
      updatedRoom.pickEvents = [...updatedRoom.pickEvents, {
        timestamp: Date.now(),
        playerId: myPlayerId,
        cardInfo: new CardInfo(character.id, 0),
        reactionTime,
        isCorrect: false,
      }];
      
      if (isSupabaseConfigured()) {
        await roomService.recordPickEvent(roomState.roomId, myPlayerId, character.id, false, reactionTime);
        await roomService.updatePlayerState(myPlayerId, {
          combo: 0,
          wrongCount: (myPlayer?.wrongCount || 0) + 1,
          isLocked: true,
        });
      } else {
        roomSync.updateRoom(updatedRoom);
      }
      setRoomState(updatedRoom);
      
      setTimeout(async () => {
        if (isSupabaseConfigured()) {
          await roomService.updatePlayerState(myPlayerId, { isLocked: false });
        } else {
          const unlockedRoom = {
            ...updatedRoom,
            players: updatedRoom.players.map(p =>
              p.id === myPlayerId ? { ...p, isLocked: false } : p
            ),
          };
          roomSync.updateRoom(unlockedRoom);
        }
        setRoomState(prev => ({
          ...prev,
          players: prev.players.map(p =>
            p.id === myPlayerId ? { ...p, isLocked: false } : p
          ),
        }));
        setSelectedCard(null);
      }, 2000);
    }
  }, [selectedCard, roomState, myPlayerId, myPlayer, playSound, showComboPopup, deckCards, endGame]);
  
  const togglePause = useCallback(async () => {
    if (!isHost || roomState.gameMode !== GameMode.Judge) return;
    
    const newPaused = !roomState.paused;
    const pausedTimeRemaining = newPaused ? turnTimer : roomState.pausedTimeRemaining;
    
    const updatedRoom = {
      ...roomState,
      paused: newPaused,
      pausedTimeRemaining,
    };
    
    if (isSupabaseConfigured()) {
      await roomService.updateRoomState(roomState.roomId, {
        paused: newPaused,
        pausedTimeRemaining,
      });
    } else {
      roomSync.updateRoom(updatedRoom);
    }
    setRoomState(updatedRoom);
  }, [isHost, roomState, turnTimer]);
  
  const copyRoomId = useCallback(() => {
    navigator.clipboard.writeText(roomState.roomId);
    showConnectionNotice('info', '鎴块棿鍙峰凡澶嶅埗', [
      `鎶婃埧闂村彿 ${roomState.roomId} 鍙戠粰浣犵殑鏈嬪弸鍗冲彲鍔犲叆銆俙,
      '濡傛灉鏈嬪弸宸茬粡鎵撳紑鍚屼竴涓綉绔欙紝涔熷彲浠ョ洿鎺ュ湪澶у巺閲岀湅鍒颁綘鐨勬埧闂淬€?,
    ]);
  }, [roomState.roomId, showConnectionNotice]);

  const copyInviteLink = useCallback(() => {
    if (!inviteUrl) {
      showConnectionNotice('warning', '閭€璇烽摼鎺ユ殏涓嶅彲鐢?, [
        '褰撳墠杩樻病鏈夊彲澶嶅埗鐨勫叕缃戝湴鍧€銆?,
        '閮ㄧ讲鍒?Vercel 鍚庯紝杩欓噷浼氳嚜鍔ㄧ敓鎴愬彲鐩存帴鎵撳紑鐨勫叆鎴块摼鎺ャ€?,
      ]);
      return;
    }

    navigator.clipboard.writeText(inviteUrl);
    showConnectionNotice('info', '閭€璇烽摼鎺ュ凡澶嶅埗', [
      '宸茬粡澶嶅埗鍙洿鎺ユ墦寮€鐨勮繘鎴块摼鎺ャ€?,
      '鏈嬪弸鐐瑰紑鍚庝細鑷姩甯︿笂鎴块棿鍙枫€?,
    ]);
  }, [inviteUrl, showConnectionNotice]);

  const copyInviteMessage = useCallback(() => {
    const inviteMessage = [
      '鏉ヤ竴璧风帺浜屾鍏冩瓕鐗屽惂锛?,
      `鎴块棿鍙凤細${roomState.roomId}`,
      `褰撳墠鐘舵€侊細${getRoomPhaseLabel(roomState.gamePhase)}`,
      isHost ? '鎴戞槸鎴夸富锛屼綘杩涙潵鍚庣洿鎺ョ偣鍔犲叆灏辫銆? : '杩涘叆缃戠珯鍚庤緭鍏ユ埧闂村彿鍗冲彲鍔犲叆銆?,
      ...(inviteUrl ? [`直接加入：${inviteUrl}`] : []),
    ].join('\n');

    navigator.clipboard.writeText(inviteMessage);
    showConnectionNotice('info', '閭€璇锋枃妗堝凡澶嶅埗', [
      '宸茬粡甯綘鐢熸垚涓€娈靛彲浠ョ洿鎺ュ彂缁欐湅鍙嬬殑閭€璇锋枃鏈€?,
      '浣犲彲浠ョ矘璐村埌 QQ銆佸井淇°€丏iscord 鎴栧叾浠栬亰澶╁伐鍏烽噷銆?,
    ]);
  }, [inviteUrl, isHost, roomState.gamePhase, roomState.roomId, showConnectionNotice]);
  
  const sendChatMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;
    
    const newMessage = {
      id: `local-${Date.now()}`,
      sender: myPlayerId,
      senderName: playerName,
      message: message.trim(),
      timestamp: Date.now(),
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    
    if (isSupabaseConfigured()) {
      await roomService.sendChatMessage(roomState.roomId, myPlayerId, playerName, message.trim());
    }
  }, [roomState.roomId, myPlayerId, playerName]);
  
  useEffect(() => {
    if (!roomState.roomId) return;
    
    if (isSupabaseConfigured()) {
      setChatSyncStatus('connecting');
      roomService.getChatMessages(roomState.roomId).then(messages => {
        setChatSyncStatus('live');
        setChatMessages(messages.map(m => ({
          id: m.id,
          sender: m.playerId,
          senderName: m.playerName,
          message: m.message,
          timestamp: new Date(m.createdAt).getTime(),
        })));
      });
      
      const unsubscribe = roomService.subscribeToChat(roomState.roomId, (msg) => {
        setChatSyncStatus('live');
        setChatMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, {
            id: msg.id,
            sender: msg.playerId,
            senderName: msg.playerName,
            message: msg.message,
            timestamp: new Date(msg.createdAt).getTime(),
          }];
        });
      });
      
      return () => unsubscribe();
    }

    setChatSyncStatus('local');
    return undefined;
  }, [roomState.roomId]);
  
  const addTestBot = useCallback(async () => {
    if (roomState.players.length >= 8) {
      alert('鎴块棿宸叉弧锛?);
      return;
    }
    
    const botId = `bot-${Date.now()}`;
    const botName = `娴嬭瘯鏈哄櫒浜?{roomState.players.filter(p => String(p.id).startsWith('bot')).length + 1}`;
    
    const newBot: PlayerInfo = {
      id: botId,
      name: botName,
      avatar: undefined,
      isHost: false,
      isObserver: false,
      isLocked: false,
      isReady: true,
      score: 0,
      combo: 0,
      maxCombo: 0,
      correctCount: 0,
      wrongCount: 0,
      totalReactionTime: 0,
      deck: [],
      collected: [],
      seatIndex: roomState.players.length,
    };
    
    if (isSupabaseConfigured()) {
      await roomService.joinRoom(roomState.roomId, botName, false);
    } else {
      const updatedRoom = {
        ...roomState,
        players: [...roomState.players, newBot],
      };
      roomSync.updateRoom(updatedRoom);
      setRoomState(updatedRoom);
    }
  }, [roomState]);
  
  const simulateBotPlay = useCallback(() => {
    if (roomState.gamePhase !== GamePhase.Playing) return;
    
    const bots = roomState.players.filter(p => String(p.id).startsWith('bot') && !p.isLocked);
    if (bots.length === 0) return;
    
    const randomBot = bots[Math.floor(Math.random() * bots.length)];
    const availableCards = deckCards.filter(card => 
      !roomState.players.some(p => p.collected?.some(c => c.characterId === card.id))
    );
    
    if (availableCards.length === 0) return;
    
    const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
    const isCorrect = Math.random() > 0.5;
    
    if (isCorrect && roomState.currentCharacterId) {
      const correctCard = deckCards.find(c => c.id === roomState.currentCharacterId);
      if (correctCard) {
        handleCardClick(correctCard);
      }
    } else {
      handleCardClick(randomCard);
    }
  }, [roomState, deckCards]);
  
  useEffect(() => {
    if (roomState.gamePhase === GamePhase.Playing && !roomState.paused) {
      const interval = setInterval(() => {
        simulateBotPlay();
      }, 2000 + Math.random() * 3000);
      
      return () => clearInterval(interval);
    }
  }, [roomState.gamePhase, roomState.paused, simulateBotPlay]);
  
  const TURN_DURATION = 60;
  
  const remainingTime = useMemo(() => {
    if (roomState.gamePhase !== GamePhase.Playing) return TURN_DURATION;
    if (!roomState.turnStartTime) return TURN_DURATION;
    if (roomState.paused) return roomState.pausedTimeRemaining || TURN_DURATION;
    
    const elapsed = Math.floor((Date.now() - roomState.turnStartTime) / 1000);
    const remaining = Math.max(0, TURN_DURATION - elapsed);
    return remaining;
  }, [roomState.gamePhase, roomState.turnStartTime, roomState.paused, roomState.pausedTimeRemaining]);
  
  useEffect(() => {
    if (roomState.gamePhase === GamePhase.Playing && !roomState.paused && roomState.turnStartTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - (roomState.turnStartTime || 0)) / 1000);
        if (elapsed >= TURN_DURATION && isHost) {
          nextTurn();
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [roomState.gamePhase, roomState.turnStartTime, roomState.paused, isHost, nextTurn]);
  
  useEffect(() => {
    if (roomState.gamePhase === GamePhase.Lobby) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && isHost && roomState.gameMode === GameMode.Judge) {
        e.preventDefault();
        if (roomState.gamePhase === GamePhase.Playing) {
          nextTurn();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [roomState.gamePhase, roomState.gameMode, isHost, nextTurn]);
  
  if (!mounted) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}>
        <CircularProgress sx={{ color: '#fff' }} />
      </Box>
    );
  }
  
  if (viewMode === 'profile') {
    return (
      <ProfilePage 
        onBack={() => setViewMode('lobby')}
        onProfileUpdate={(updatedProfile) => {
          setUserProfile(updatedProfile);
          setPlayerName(updatedProfile.displayName);
          
          if (roomState.roomId && myPlayerId) {
            const updatedRoom = {
              ...roomState,
              players: roomState.players.map(p => 
                p.id === myPlayerId 
                  ? { ...p, name: updatedProfile.displayName, avatar: updatedProfile.avatar }
                  : p
              ),
            };
            roomSync.updateRoom(updatedRoom);
            setRoomState(updatedRoom);
          }
        }}
        onUseDeck={(deck) => {
          const cards: CharacterConfig[] = deck.cards.map(card => ({
            id: card.id,
            name: card.name,
            anime: card.anime,
            emoji: '馃幋',
            card: [],
            quotes: card.quotes,
            color: card.color,
            coverImage: card.coverImage,
          }));
          
          const newRoom: RoomState = {
            roomId: generateRoomId(),
            hostId: myPlayerId,
            players: [{
              id: myPlayerId,
              name: playerName,
              avatar: userProfile?.avatar,
              isHost: true,
              isObserver: false,
              isLocked: false,
              isReady: true,
              score: 0,
              combo: 0,
              maxCombo: 0,
              correctCount: 0,
              wrongCount: 0,
              totalReactionTime: 0,
              deck: [],
              collected: [],
              seatIndex: 0,
            }],
            gameMode: GameMode.AutoRandom,
            gamePhase: GamePhase.Lobby,
            currentCharacterId: null,
            currentQuote: null,
            turnStartTime: null,
            pickEvents: [],
            deckRows: 3,
            deckColumns: 8,
            playbackSetting: {
              countdown: false,
              randomStartPosition: false,
              playbackDuration: 0,
            },
            paused: false,
            pausedTimeRemaining: 0,
            customCards: deck.cards,
            deckType: 'custom',
            deckCards: cards,
            currentTurnPicks: [],
            createdAt: Date.now(),
          };
          
          roomSync.createRoom(newRoom);
          setRoomState(newRoom);
          setDeckCards(cards);
          setViewMode('room');
        }}
      />
    );
  }
  
  if (viewMode === 'guessSong') {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}>
        <GuessSongGame onBack={() => setViewMode('lobby')} />
      </Box>
    );
  }
  
  if (viewMode === 'songLibrary') {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}>
        <SongLibraryManager onBack={() => setViewMode('lobby')} />
      </Box>
    );
  }
  
  if (!roomState.roomId || viewMode === 'lobby') {
    return (
      <>
        <SakuraBackground />
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            zIndex: 1,
            p: 3,
          }}
        >
          <Paper
            className="glass-panel"
            sx={{
              p: 4,
              maxWidth: 800,
              width: '100%',
              mb: 3,
            }}
          >
            <Typography
              variant="h3"
              className="title-anime"
              sx={{
                textAlign: 'center',
                mb: 2,
                background: 'linear-gradient(45deg, #ff6b9d, #c77dff, #7b9fff)',
                backgroundSize: '300% 300%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'gradient-shift 4s ease infinite',
              }}
            >
              馃尭 浜屾鍏冩瓕鐗?2.0 馃尭
            </Typography>
            <Typography sx={{ textAlign: 'center', color: '#ff6b9d', mb: 3, fontWeight: 500 }}>
              Anime Karuta ~ 2026骞存柊鐣増
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  cursor: 'pointer',
                  p: 1,
                  borderRadius: 3,
                  border: '2px solid rgba(199,125,255,0.3)',
                  bgcolor: 'rgba(255,255,255,0.5)',
                  transition: 'all 0.3s',
                  '&:hover': {
                    border: '2px solid #ff6b9d',
                    bgcolor: 'rgba(255,107,157,0.1)',
                  },
                }}
                onClick={() => setViewMode('profile')}
              >
                {renderUserAvatar(userProfile?.avatar, 36)}
                <Box>
                  <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>
                    ID: {userProfile?.id || '------'}
                  </Typography>
                  <Typography sx={{ fontWeight: 600, color: '#333', fontSize: '0.9rem' }}>
                    {userProfile?.displayName || playerName}
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            <TextField
              fullWidth
              label="浣犵殑鏄电О"
              value={playerName}
              onChange={(e) => {
                const newName = e.target.value.slice(0, 12);
                setPlayerName(newName);
                setGuestSessionReady(false);
                if (userProfile) {
                  const updated = userProfileService.updateProfile({ displayName: newName });
                  setUserProfile(updated);
                }
              }}
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  bgcolor: 'rgba(255,255,255,0.8)',
                }
              }}
              inputProps={{ maxLength: 12 }}
            />

            <Alert
              severity={guestSessionReady ? 'success' : 'info'}
              sx={{ mb: 3, borderRadius: 3 }}
            >
              <Typography sx={{ fontWeight: 700, mb: 0.5 }}>
                {guestSessionReady ? '娓稿韬唤宸插氨缁? : '鏃犻渶娉ㄥ唽涔熻兘鑱旀満'}
              </Typography>
              <Typography sx={{ fontSize: '0.9rem' }}>
                {guestSessionPending
                  ? '姝ｅ湪涓轰綘鍑嗗娓稿韬唤锛岀◢绛夊嚑绉掑悗灏辫兘寤烘埧鎴栧姞鎴裤€?
                  : `鐩存帴杈撳叆鏄电О灏辫兘寮€濮嬨€?{isSupabaseConfigured() ? '鐐光€滃垱寤烘埧闂粹€濇垨鈥滆緭鍏ユ埧闂村彿鈥濇椂锛岀郴缁熶細鑷姩寤虹珛 Supabase 娓稿韬唤銆? : '褰撳墠鏄湰鍦版ā寮忥紝绋嶅悗閮ㄧ讲鍒板叕缃戝悗涔熷彲浠ユ部鐢ㄨ繖濂楁父瀹㈡祦绋嬨€?}`}
              </Typography>
              {isLikelyGuestUser && userProfile && (
                <Typography sx={{ fontSize: '0.85rem', mt: 0.75 }}>
                  褰撳墠韬唤锛歿userProfile.displayName} / {userProfile.id}
                </Typography>
              )}
            </Alert>

            {connectionNotice && (
              <Alert
                severity={connectionNotice.severity}
                sx={{
                  mb: 3,
                  borderRadius: 3,
                  alignItems: 'flex-start',
                  '& .MuiAlert-message': {
                    width: '100%',
                  },
                }}
              >
                <Typography sx={{ fontWeight: 700, mb: 0.5 }}>
                  {connectionNotice.title}
                </Typography>
                {connectionNotice.lines.map((line, index) => (
                  <Typography key={`${index}-${line}`} sx={{ fontSize: '0.9rem', mb: 0.5 }}>
                    {line}
                  </Typography>
                ))}
              </Alert>
            )}
            
            <Typography sx={{ mb: 1, color: '#ff6b9d', fontSize: '0.9rem', fontWeight: 500 }}>
              閫夋嫨鐗岀粍
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
              <Paper
                onClick={() => setSelectedDeck('anime2026')}
                className="anime-card"
                sx={{
                  p: 2,
                  flex: 1,
                  cursor: 'pointer',
                  border: selectedDeck === 'anime2026' 
                    ? '2px solid #ff6b9d'
                    : '2px solid rgba(255,107,157,0.2)',
                }}
              >
                <Typography sx={{ fontWeight: 'bold', color: '#ff6b9d', mb: 0.5 }}>
                  馃尭 2026骞存柊鐣?
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>
                  30寮犵簿閫夋柊鐣崱鐗?
                </Typography>
              </Paper>
              <Paper
                onClick={() => setSelectedDeck('custom')}
                className="anime-card"
                sx={{
                  p: 2,
                  flex: 1,
                  cursor: 'pointer',
                  border: selectedDeck === 'custom' 
                    ? '2px solid #c77dff'
                    : '2px solid rgba(199,125,255,0.2)',
                }}
              >
                <Typography sx={{ fontWeight: 'bold', color: '#c77dff', mb: 0.5 }}>
                  馃帹 鑷畾涔夌墝缁?
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>
                  杩涘叆鎴块棿鍚庝笂浼犲崱鐗?
                </Typography>
              </Paper>
            </Stack>
            
            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={createRoom}
                disabled={guestSessionPending}
                className="anime-button anime-button-primary"
                sx={{
                  py: 1.5,
                  fontSize: '1.1rem',
                }}
              >
                <Groups sx={{ mr: 1 }} />
                鍒涘缓鎴块棿
              </Button>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={() => setShowJoinDialog(true)}
                disabled={guestSessionPending}
                className="anime-button"
                sx={{
                  borderColor: '#c77dff',
                  color: '#c77dff',
                  py: 1.5,
                }}
              >
                <Person sx={{ mr: 1 }} />
                杈撳叆鎴块棿鍙?
              </Button>
            </Stack>
            
            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={() => setViewMode('guessSong')}
              sx={{
                mt: 2,
                borderColor: '#1dd1a1',
                color: '#1dd1a1',
                py: 1.5,
                borderRadius: 3,
                '&:hover': {
                  borderColor: '#10b981',
                  bgcolor: 'rgba(29, 209, 161, 0.1)',
                },
              }}
            >
              馃幍 鐚滄瓕妯″紡
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={() => setViewMode('songLibrary')}
              sx={{
                mt: 2,
                borderColor: '#9333ea',
                color: '#9333ea',
                py: 1.5,
                borderRadius: 3,
                '&:hover': {
                  borderColor: '#7c3aed',
                  bgcolor: 'rgba(147, 51, 234, 0.1)',
                },
              }}
            >
              馃幖 姝屾洸搴撶鐞?
            </Button>
          </Paper>
          
          <Paper
            sx={{
              p: 3,
              className: 'glass-panel',
              maxWidth: 800,
              width: '100%',
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, color: '#ff6b9d', fontWeight: 'bold' }}>
              馃彔 娓告垙澶у巺 - 褰撳墠鎴块棿 ({roomsList.length})
            </Typography>
            
            {roomsList.length === 0 ? (
              <Typography sx={{ color: '#888', textAlign: 'center', py: 4 }}>
                鏆傛棤鎴块棿锛屽揩鍒涘缓涓€涓惂锛?
              </Typography>
            ) : (
              <Stack spacing={2}>
                {roomsList.map((room) => (
                  <Paper
                    key={room.roomId}
                    className="anime-card"
                    sx={{
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Typography sx={{ fontWeight: 'bold', color: '#ff6b9d', fontSize: '1.2rem' }}>
                          {room.roomId}
                        </Typography>
                        <Chip
                          label={getRoomPhaseLabel(room.phase)}
                          size="small"
                          sx={{
                            bgcolor: room.phase === 0 ? 'rgba(74, 222, 128, 0.2)' : 
                                     room.phase === 2 ? 'rgba(255, 107, 157, 0.2)' : 'rgba(150, 150, 150, 0.2)',
                            color: room.phase === 0 ? '#22c55e' : 
                                   room.phase === 2 ? '#ff6b9d' : '#888',
                            borderRadius: 3,
                          }}
                        />
                        <Typography sx={{ color: '#666', fontSize: '0.9rem' }}>
                          鎴夸富: {room.hostName}
                        </Typography>
                        <Typography sx={{ color: '#666', fontSize: '0.9rem' }}>
                          鐜╁: {room.playerCount}/8
                        </Typography>
                      </Stack>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => joinRoom(room.roomId, false)}
                        disabled={room.phase !== 0}
                        className="anime-button"
                        sx={{
                          background: 'linear-gradient(135deg, #4ade80, #22c55e)',
                          borderRadius: 3,
                        }}
                      >
                        鍙傚姞娓告垙
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => joinRoom(room.roomId, true)}
                        className="anime-button"
                        sx={{
                          borderColor: '#c77dff',
                          color: '#c77dff',
                          borderRadius: 3,
                        }}
                      >
                        鏃佽
                      </Button>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </Paper>
          
          <Dialog open={showJoinDialog} onClose={() => setShowJoinDialog(false)}>
            <DialogTitle>鍔犲叆鎴块棿</DialogTitle>
            <DialogContent>
              <Typography sx={{ mt: 1, color: '#666', fontSize: '0.9rem' }}>
                杈撳叆濂藉弸鍒嗕韩缁欎綘鐨?6 鍒?8 浣嶆埧闂村彿銆備綘涔熷彲浠ラ€夋嫨鐩存帴鍔犲叆娓告垙锛屾垨鍏堜互鏃佽韬唤杩涘叆鎴块棿銆?
              </Typography>
              <TextField
                autoFocus
                fullWidth
                label="鎴块棿鍙?
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                sx={{ mt: 1 }}
                inputProps={{ maxLength: 6 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowJoinDialog(false)} disabled={guestSessionPending}>鍙栨秷</Button>
              <Button onClick={() => joinRoom(joinRoomId, true)} variant="outlined" disabled={guestSessionPending}>鏃佽</Button>
              <Button onClick={() => joinRoom(joinRoomId, false)} variant="contained" disabled={guestSessionPending}>鍔犲叆娓告垙</Button>
            </DialogActions>
          </Dialog>
        </Box>
      </>
    );
  }
  
  return (
    <>
      <SakuraBackground />
      <Box sx={{ minHeight: '100vh', position: 'relative', zIndex: 1, p: 2 }}>
        <audio ref={audioRef} />
        <audio ref={successAudioRef} src="data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=" />
        <audio ref={failAudioRef} src="data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=" />
        
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography
              sx={{
                fontFamily: '"ZCOOL KuaiLe", cursive',
                fontSize: '1.5rem',
                background: 'linear-gradient(45deg, #ff6b9d, #c77dff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              馃尭 浜屾鍏冩瓕鐗?
            </Typography>
            <Chip
              label={`鎴块棿: ${roomState.roomId}`}
              onClick={copyRoomId}
              onDelete={copyRoomId}
              deleteIcon={<ContentCopy />}
              sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#fff' }}
            />
          </Stack>
          
          <Stack direction="row" spacing={1}>
            {isHost && roomState.gamePhase === GamePhase.Playing && (
              <Button
                variant="outlined"
                size="small"
                onClick={async () => {
                  if (confirm('纭畾瑕佺粨鏉熸父鎴忓悧锛熷皢鍥炲埌鎴块棿鍑嗗闃舵銆?)) {
                    const updatedRoom = {
                      ...roomState,
                      gamePhase: GamePhase.Lobby,
                      currentCharacterId: null,
                      currentQuote: null,
                      turnStartTime: null,
                      pickEvents: [],
                      currentTurnPicks: [],
                      paused: false,
                    };
                    
                    if (isSupabaseConfigured()) {
                      await roomService.updateRoomState(roomState.roomId, {
                        gamePhase: GamePhase.Lobby,
                        currentCharacterId: null,
                        currentQuote: null,
                        turnStartTime: null,
                        paused: false,
                      });
                    } else {
                      roomSync.updateRoom(updatedRoom);
                    }
                    setRoomState(updatedRoom);
                    setDeckCards([]);
                    setSelectedCard(null);
                  }
                }}
                startIcon={<ExitToApp />}
                sx={{
                  borderColor: '#ef4444',
                  color: '#ef4444',
                  '&:hover': { borderColor: '#dc2626', bgcolor: 'rgba(239,68,68,0.1)' },
                }}
              >
                缁撴潫娓告垙
              </Button>
            )}
            <Button
              variant="outlined"
              size="small"
              onClick={leaveRoom}
              startIcon={<ExitToApp />}
              sx={{
                borderColor: '#ff6b9d',
                color: '#ff6b9d',
                '&:hover': { borderColor: '#ff85ad', bgcolor: 'rgba(255,107,157,0.1)' },
              }}
            >
              鍥炲埌澶у巺
            </Button>
            <IconButton onClick={() => setIsMuted(!isMuted)} sx={{ color: '#fff' }}>
              {isMuted ? <VolumeOff /> : <VolumeUp />}
            </IconButton>
            <IconButton onClick={() => setShowSettingsDialog(true)} sx={{ color: '#fff' }}>
              <Settings />
            </IconButton>
          </Stack>
        </Stack>

        {connectionNotice && (
          <Alert
            severity={connectionNotice.severity}
            sx={{
              mb: 2,
              borderRadius: 3,
              alignItems: 'flex-start',
              '& .MuiAlert-message': {
                width: '100%',
              },
            }}
          >
            <Typography sx={{ fontWeight: 700, mb: 0.5 }}>
              {connectionNotice.title}
            </Typography>
            {connectionNotice.lines.map((line, index) => (
              <Typography key={`${index}-${line}`} sx={{ fontSize: '0.9rem', mb: 0.5 }}>
                {line}
              </Typography>
            ))}
          </Alert>
        )}

        <Paper
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 3,
            bgcolor: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
            <Box>
              <Typography sx={{ fontWeight: 700, color: '#fff', mb: 0.5 }}>
                鎴块棿鐘舵€侊細{getRoomPhaseLabel(roomState.gamePhase)}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }} useFlexGap>
                <Chip
                  size="small"
                  color={roomSyncStatus === 'live' ? 'success' : roomSyncStatus === 'connecting' ? 'warning' : 'default'}
                  label={roomSyncStatus === 'live' ? '鎴块棿鍚屾姝ｅ父' : roomSyncStatus === 'connecting' ? '鎴块棿鍚屾杩炴帴涓? : '鏈湴鎴块棿妯″紡'}
                />
                <Chip
                  size="small"
                  color={chatSyncStatus === 'live' ? 'success' : chatSyncStatus === 'connecting' ? 'warning' : 'default'}
                  label={chatSyncStatus === 'live' ? '鑱婂ぉ鍚屾姝ｅ父' : chatSyncStatus === 'connecting' ? '鑱婂ぉ鍚屾杩炴帴涓? : '鑱婂ぉ鏈湴妯″紡'}
                />
                <Chip
                  size="small"
                  color={guestSessionReady ? 'success' : 'warning'}
                  label={guestSessionReady ? '娓稿韬唤宸茶繛鎺ヤ簯绔? : '娓稿韬唤涓存椂妯″紡'}
                />
              </Stack>
              <Typography sx={{ color: 'rgba(255,255,255,0.78)', fontSize: '0.92rem' }}>
                鐜╁ {activePlayerCount} 浜猴紝宸插噯澶?{readyPlayerCount} 浜猴紝鏃佽 {observerCount} 浜?
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.62)', fontSize: '0.85rem', mt: 0.5 }}>
                {isHost
                  ? '鎶婃埧闂村彿鎴栭個璇锋枃妗堝彂缁欏ソ鍙嬶紝瀵规柟鎵撳紑鍚屼竴涓綉绔欏悗鍗冲彲鍔犲叆銆?
                  : '濡傛灉浣犳槸鍚庢潵鍔犲叆鐨勭帺瀹讹紝绛夋埧涓荤‘璁ゅぇ瀹堕兘鍑嗗濂藉悗灏卞彲浠ュ紑濮嬨€?}
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', md: 'auto' } }}>
              <Button
                variant="outlined"
                onClick={copyRoomId}
                startIcon={<ContentCopy />}
                sx={{ borderColor: '#c77dff', color: '#fff' }}
              >
                澶嶅埗鎴块棿鍙?
              </Button>
              <Button
                variant="contained"
                onClick={copyInviteMessage}
                startIcon={<Groups />}
                sx={{
                  background: 'linear-gradient(135deg, #ff6b9d, #c77dff)',
                }}
              >
                澶嶅埗閭€璇锋枃妗?
              </Button>
            </Stack>
          </Stack>
        </Paper>
        
        {roomState.gamePhase === GamePhase.Lobby && (
          <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
            <Paper
              className="glass-panel"
              sx={{
                p: 3,
                mb: 3,
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, color: '#ff6b9d', fontWeight: 'bold' }}>
                鍑嗗鍖?
              </Typography>
              
              <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <Button
                  variant={roomState.gameMode === GameMode.AutoRandom ? 'contained' : 'outlined'}
                  onClick={() => {
                    const updatedRoom = { ...roomState, gameMode: GameMode.AutoRandom };
                    roomSync.updateRoom(updatedRoom);
                    setRoomState(updatedRoom);
                  }}
                  className={roomState.gameMode === GameMode.AutoRandom ? 'anime-button anime-button-primary' : 'anime-button'}
                  sx={{ borderColor: '#c77dff', color: roomState.gameMode === GameMode.AutoRandom ? '#fff' : '#c77dff' }}
                >
                  <Casino sx={{ mr: 1 }} />
                  鑷姩闅忔満妯″紡
                </Button>
                <Button
                  variant={roomState.gameMode === GameMode.Judge ? 'contained' : 'outlined'}
                  onClick={() => {
                    const updatedRoom = { ...roomState, gameMode: GameMode.Judge };
                    roomSync.updateRoom(updatedRoom);
                    setRoomState(updatedRoom);
                  }}
                  className={roomState.gameMode === GameMode.Judge ? 'anime-button anime-button-primary' : 'anime-button'}
                  sx={{ borderColor: '#c77dff', color: roomState.gameMode === GameMode.Judge ? '#fff' : '#c77dff' }}
                  disabled={!isHost}
                >
                  <SportsEsports sx={{ mr: 1 }} />
                  瑁佸垽妯″紡
                </Button>
              </Stack>
              
              <Typography sx={{ mb: 2, color: '#ff6b9d', fontWeight: 500 }}>
                鐜╁ ({roomState.players.length}/8)
              </Typography>
              
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                {roomState.players.map((player) => (
                  <Paper
                    key={player.id}
                    className="anime-card"
                    sx={{
                      p: 1.5,
                      position: 'relative',
                      border: player.id === myPlayerId ? '2px solid #ff6b9d' : '2px solid rgba(255,107,157,0.2)',
                    }}
                  >
                    {player.isLocked && (
                      <Box className="locked-overlay">
                        <Lock sx={{ fontSize: 32, color: '#ff4757' }} />
                      </Box>
                    )}
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar
                        sx={{
                          bgcolor: player.isHost ? '#ffd700' : player.isObserver ? '#888' : '#c77dff',
                          width: 40,
                          height: 40,
                        }}
                      >
                        {player.isObserver ? '馃憗' : player.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                          {player.name}
                          {player.isHost && <Star sx={{ fontSize: 14, color: '#ffd700', ml: 0.5 }} />}
                        </Typography>
                        <Stack direction="row" spacing={0.5}>
                          {player.isObserver ? (
                            <Chip
                              icon={<Visibility sx={{ fontSize: 14 }} />}
                              label="鏃佽"
                              size="small"
                              sx={{ 
                                height: 20, 
                                fontSize: '0.7rem',
                                bgcolor: 'rgba(136, 136, 136, 0.3)',
                                color: '#aaa'
                              }}
                            />
                          ) : (
                            <Chip
                              icon={player.isReady ? <CheckCircle /> : undefined}
                              label={player.isReady ? '宸插噯澶? : '鏈噯澶?}
                              size="small"
                              sx={{ 
                                height: 20, 
                                fontSize: '0.7rem',
                                bgcolor: player.isReady ? 'rgba(74, 222, 128, 0.3)' : 'rgba(255, 71, 87, 0.3)',
                                color: player.isReady ? '#4ade80' : '#ff4757'
                              }}
                            />
                          )}
                          {player.isHost && (
                            <Chip
                              label="鎴夸富"
                              size="small"
                              sx={{ 
                                height: 20, 
                                fontSize: '0.7rem',
                                bgcolor: 'rgba(255, 215, 0, 0.3)',
                                color: '#ffd700'
                              }}
                            />
                          )}
                        </Stack>
                      </Box>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
              
              {isHost && roomState.players.length < 8 && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={addTestBot}
                  sx={{
                    mb: 2,
                    borderColor: '#4ade80',
                    color: '#4ade80',
                    '&:hover': { borderColor: '#22c55e', bgcolor: 'rgba(74, 222, 128, 0.1)' },
                  }}
                >
                  馃 娣诲姞娴嬭瘯鏈哄櫒浜?
                </Button>
              )}
              
              {!isHost && !myPlayer?.isObserver && (
                <Button
                  variant="contained"
                  size="large"
                  onClick={toggleReady}
                  sx={{
                    mb: 2,
                    background: myPlayer?.isReady 
                      ? 'linear-gradient(45deg, #4ade80, #22c55e)' 
                      : 'linear-gradient(45deg, #ff6b9d, #c77dff)',
                    py: 1.5,
                    px: 4,
                  }}
                >
                  {myPlayer?.isReady ? <CheckCircle sx={{ mr: 1 }} /> : <PlayArrow sx={{ mr: 1 }} />}
                  {myPlayer?.isReady ? '鍙栨秷鍑嗗' : '鍑嗗'}
                </Button>
              )}
              {myPlayer?.isObserver && (
                <Typography sx={{ color: '#aaa', mb: 2, textAlign: 'center' }}>
                  馃憗 鏃佽妯″紡 - 鎮ㄥ彧鑳借鐪嬫父鎴?
                </Typography>
              )}
            </Paper>
            
            <Paper
              className="glass-panel"
              sx={{
                p: 3,
                mb: 3,
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, color: '#ff6b9d', fontWeight: 'bold' }}>
                馃挰 鑱婂ぉ瀹?
              </Typography>
              
              <Box
                data-testid="chat-messages"
                sx={{
                  height: 200,
                  overflow: 'auto',
                  mb: 2,
                  p: 1,
                  bgcolor: 'rgba(0,0,0,0.2)',
                  borderRadius: 1,
                }}
              >
                {chatMessages.length === 0 ? (
                  <Typography sx={{ color: '#888', textAlign: 'center', mt: 4 }}>
                    鏆傛棤娑堟伅锛屽彂閫佺涓€鏉℃秷鎭惂锛?
                  </Typography>
                ) : (
                  chatMessages.map((msg) => (
                    <Box key={msg.id} sx={{ mb: 1 }}>
                      <Typography sx={{ fontSize: '0.85rem' }}>
                        <span style={{ color: msg.sender === myPlayerId ? '#ff6b9d' : '#c77dff', fontWeight: 'bold' }}>
                          {msg.senderName}:
                        </span>{' '}
                        <span style={{ color: '#fff' }}>{msg.message}</span>
                      </Typography>
                    </Box>
                  ))
                )}
              </Box>
              
              <Stack direction="row" spacing={1}>
                <TextField
                  size="small"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && chatInput.trim()) {
                      sendChatMessage(chatInput);
                      setChatInput('');
                    }
                  }}
                  placeholder="杈撳叆娑堟伅..."
                  inputProps={{ 'data-testid': 'chat-input' }}
                  sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255,255,255,0.1)',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                      '&:hover fieldset': { borderColor: '#ff6b9d' },
                    },
                    '& .MuiInputBase-input': { color: '#fff' },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={() => {
                    if (chatInput.trim()) {
                      sendChatMessage(chatInput);
                      setChatInput('');
                    }
                  }}
                  sx={{
                    background: 'linear-gradient(45deg, #ff6b9d, #c77dff)',
                  }}
                >
                  鍙戦€?
                </Button>
              </Stack>
            </Paper>
            
            <Paper
              className="glass-panel"
              sx={{
                p: 3,
                mb: 3,
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, color: '#ff6b9d', fontWeight: 'bold' }}>
                鐐规瓕鏈?- 2026骞存柊鐣墝缁?
              </Typography>
              
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'repeat(3, 1fr)',
                    sm: 'repeat(4, 1fr)',
                    md: 'repeat(4, 1fr)',
                  },
                  gap: 2,
                  maxHeight: 400,
                  overflow: 'auto',
                  p: 1,
                }}
              >
                {getAnimeData().slice(0, 30).map((anime) => (
                  <Box
                    key={anime.id}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 3,
                      overflow: 'hidden',
                      bgcolor: 'rgba(255,255,255,0.6)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      '&:hover': { 
                        transform: 'scale(1.05)',
                        boxShadow: '0 8px 25px rgba(255, 107, 157, 0.3)',
                        border: '2px solid #ff6b9d',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: '100%',
                        paddingTop: '133%',
                        position: 'relative',
                        background: anime.coverImageMedium 
                          ? `url(${anime.coverImageMedium}) center/cover`
                          : `linear-gradient(135deg, ${anime.color || '#ff6b9d'}40 0%, ${anime.color || '#ff6b9d'}70 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {!anime.coverImageMedium && (
                        <Typography sx={{ fontSize: '2.5rem', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                          馃幀
                        </Typography>
                      )}
                    </Box>
                    <Box
                      sx={{
                        p: 1,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 100%)',
                      }}
                    >
                      <Typography sx={{ 
                        fontSize: '0.85rem', 
                        fontWeight: 'bold',
                        textAlign: 'center', 
                        color: '#fff',
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {anime.nameCn || anime.name}
                      </Typography>
                      <Typography sx={{ 
                        fontSize: '0.7rem', 
                        textAlign: 'center', 
                        color: 'rgba(255,255,255,0.7)',
                        mt: 0.3,
                      }}>
                        {anime.animeCn || anime.anime}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
            
            {isHost && (
              <Paper
                className="glass-panel"
                sx={{
                  p: 3,
                  mb: 3,
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, color: '#ff6b9d', fontWeight: 'bold' }}>
                  鑷畾涔夋瓕鐗屼笂浼?
                </Typography>
                
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Upload />}
                    onClick={() => setShowGlobalDecksDialog(true)}
                    sx={{ borderColor: '#c77dff', color: '#c77dff' }}
                  >
                    鐗岀粍搴?
                  </Button>
                  {roomState.customCards.length > 0 && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Add />}
                      onClick={() => setShowSaveDeckDialog(true)}
                      sx={{ borderColor: '#4ade80', color: '#4ade80' }}
                    >
                      淇濆瓨鐗岀粍
                    </Button>
                  )}
                </Stack>
                
                <Paper
                  sx={{
                    p: 1.5,
                    mb: 2,
                    bgcolor: 'rgba(255,107,157,0.1)',
                    borderRadius: 2,
                    border: '1px solid rgba(255,107,157,0.3)',
                  }}
                >
                  <Typography sx={{ fontSize: '0.8rem', color: '#ff6b9d' }}>
                    馃挕 鎻愮ず锛氭坊鍔犺嚜瀹氫箟姝岀墝鍚庡皢鑷姩浣跨敤鑷畾涔夌墝缁勶紝鏃犳硶涓庣郴缁熺墝缁勬贩鍚堜娇鐢?
                  </Typography>
                </Paper>
                
                <CustomCardUploader onAddCard={addCustomCard} />
                
                {roomState.customCards.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography sx={{ mb: 1, color: '#ff6b9d', fontSize: '0.9rem', fontWeight: 500 }}>
                      宸叉坊鍔犵殑鑷畾涔夊崱鐗?({roomState.customCards.length})
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {roomState.customCards.map((card) => (
                        <Paper
                          key={card.id}
                          className="anime-card"
                          sx={{
                            p: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }}
                        >
                          <Box
                            sx={{
                              width: 40,
                              height: 50,
                              borderRadius: 1,
                              background: card.coverImage 
                                ? `url(${card.coverImage}) center/cover`
                                : `linear-gradient(135deg, ${card.color || '#ff6b9d'}40 0%, ${card.color || '#ff6b9d'}70 100%)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1rem',
                            }}
                          >
                            {!card.coverImage && '馃幀'}
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#4a4a6a' }}>
                              {card.name}
                            </Typography>
                            <Typography sx={{ fontSize: '0.65rem', color: '#888' }}>
                              {card.anime}
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => removeCustomCard(card.id)}
                            sx={{ color: '#ff4757' }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Paper>
            )}
            
            {isHost && (
              <Stack direction="row" spacing={2}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={startGame}
                  sx={{
                    background: 'linear-gradient(45deg, #ff6b9d, #c77dff)',
                    py: 2,
                    fontSize: '1.2rem',
                  }}
                >
                  <PlayArrow sx={{ mr: 1 }} />
                  寮€濮嬫父鎴?
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => {
                    if (confirm('纭畾瑕佽В鏁ｆ埧闂村悧锛熸墍鏈夌帺瀹跺皢琚涪鍑恒€?)) {
                      roomSync.deleteRoom(roomState.roomId);
                      setRoomState({
                        roomId: '',
                        hostId: 0,
                        players: [],
                        gameMode: GameMode.AutoRandom,
                        gamePhase: GamePhase.Lobby,
                        currentCharacterId: null,
                        currentQuote: null,
                        turnStartTime: null,
                        pickEvents: [],
                        deckRows: 3,
                        deckColumns: 8,
                        playbackSetting: {
                          countdown: false,
                          randomStartPosition: false,
                          playbackDuration: 0,
                        },
                        paused: false,
                        pausedTimeRemaining: 0,
                        customCards: [],
                        deckType: 'anime2026',
                        deckCards: [],
                        currentTurnPicks: [],
                        createdAt: Date.now(),
                      });
                      setViewMode('lobby');
                      setRoomsList(roomSync.getRoomsList());
                    }
                  }}
                  sx={{
                    borderColor: '#ef4444',
                    color: '#ef4444',
                    py: 2,
                    '&:hover': { borderColor: '#dc2626', bgcolor: 'rgba(239,68,68,0.1)' },
                  }}
                >
                  瑙ｆ暎鎴块棿
                </Button>
              </Stack>
            )}
          </Box>
        )}
        
        {roomState.gamePhase === GamePhase.Playing && (
          <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
            {roomState.paused && (
              <Box
                sx={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  bgcolor: 'rgba(0,0,0,0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 999,
                  pointerEvents: 'auto',
                }}
                onClick={(e) => {
                  if (isHost && roomState.gameMode === GameMode.Judge) {
                    togglePause();
                  }
                }}
              >
                <Paper
                  sx={{
                    p: 4,
                    background: 'linear-gradient(135deg, rgba(255,107,157,0.9) 0%, rgba(199,125,255,0.9) 100%)',
                    borderRadius: 4,
                    textAlign: 'center',
                    cursor: isHost && roomState.gameMode === GameMode.Judge ? 'pointer' : 'default',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Typography variant="h3" sx={{ fontFamily: '"ZCOOL KuaiLe", cursive', color: '#fff' }}>
                    鈴革笍 娓告垙宸叉殏鍋?
                  </Typography>
                  <Typography sx={{ mt: 2, color: '#ffc2d1' }}>
                    {isHost && roomState.gameMode === GameMode.Judge 
                      ? '鐐瑰嚮姝ゅ鎴栬鍒ゆ帶鍒跺彴缁х画娓告垙' 
                      : '绛夊緟瑁佸垽缁х画娓告垙...'}
                  </Typography>
                  {isHost && roomState.gameMode === GameMode.Judge && (
                    <Button
                      variant="contained"
                      color="success"
                      size="large"
                      sx={{ mt: 2 }}
                      onClick={togglePause}
                      startIcon={<PlayArrow />}
                    >
                      缁х画娓告垙
                    </Button>
                  )}
                </Paper>
              </Box>
            )}
            
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <Paper
                data-testid="turn-picks-panel"
                sx={{
                  p: 2,
                  background: 'linear-gradient(135deg, rgba(45,27,78,0.9) 0%, rgba(74,29,110,0.9) 100%)',
                  borderRadius: 2,
                  flex: 1,
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  {roomState.players.map((player) => (
                    <PlayerSeat
                      key={player.id}
                      player={player}
                      isSelf={player.id === myPlayerId}
                      showControls={false}
                    />
                  ))}
                </Stack>
              </Paper>
            </Stack>
            
            {roomState.gameMode === GameMode.Judge && isHost && (
              <Box
                sx={{
                  position: 'fixed',
                  bottom: 24,
                  right: 24,
                  zIndex: 9999,
                }}
              >
                  {showJudgeMenu && (
                    <Paper
                      sx={{
                        p: 2,
                        mb: 2,
                        background: 'linear-gradient(135deg, rgba(30,20,50,0.95) 0%, rgba(50,30,80,0.95) 100%)',
                        borderRadius: 4,
                        border: '2px solid rgba(255,107,157,0.5)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                        animation: 'fadeIn 0.3s ease',
                        '@keyframes fadeIn': {
                          '0%': { opacity: 0, transform: 'translateY(20px)' },
                          '100%': { opacity: 1, transform: 'translateY(0)' },
                        },
                      }}
                    >
                      <Typography sx={{ mb: 1.5, color: '#ffd700', fontWeight: 'bold', textAlign: 'center' }}>
                        瑁佸垽鎺у埗鍙?
                      </Typography>
                      <Stack direction="column" spacing={1.5}>
                        <Button 
                          variant="contained" 
                          sx={{
                            bgcolor: roomState.paused ? '#4ade80' : '#fbbf24',
                            color: '#000',
                            borderRadius: 3,
                            fontWeight: 'bold',
                            '&:hover': { bgcolor: roomState.paused ? '#22c55e' : '#f59e0b' },
                          }}
                          startIcon={roomState.paused ? <PlayArrow /> : <Pause />}
                          onClick={togglePause}
                          fullWidth
                        >
                          {roomState.paused ? '缁х画娓告垙' : '鏆傚仠娓告垙'}
                        </Button>
                        <Button 
                          variant="contained" 
                          sx={{
                            bgcolor: '#3b82f6',
                            borderRadius: 3,
                            fontWeight: 'bold',
                            '&:hover': { bgcolor: '#2563eb' },
                          }}
                          startIcon={<SkipNext />}
                          onClick={() => nextTurn()}
                          fullWidth
                        >
                          涓嬩竴棣?
                        </Button>
                        <Button 
                          variant="contained" 
                          sx={{
                            bgcolor: '#ef4444',
                            borderRadius: 3,
                            fontWeight: 'bold',
                            '&:hover': { bgcolor: '#dc2626' },
                          }}
                          startIcon={<ExitToApp />}
                          onClick={endGame}
                          fullWidth
                        >
                          缁撴潫娓告垙
                        </Button>
                      </Stack>
                    </Paper>
                  )}
                  <IconButton
                    onClick={() => setShowJudgeMenu(!showJudgeMenu)}
                    sx={{
                      width: 64,
                      height: 64,
                      bgcolor: 'linear-gradient(135deg, #ff6b9d 0%, #c77dff 100%)',
                      background: 'linear-gradient(135deg, #ff6b9d 0%, #c77dff 100%)',
                      borderRadius: '50%',
                      boxShadow: '0 4px 20px rgba(255,107,157,0.5)',
                      border: '3px solid rgba(255,255,255,0.3)',
                      '&:hover': {
                        transform: 'scale(1.1)',
                        boxShadow: '0 6px 30px rgba(255,107,157,0.7)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: '1rem' }}>
                      瑁佸垽
                    </Typography>
                  </IconButton>
                </Box>
              )}
            
            <Paper
              sx={{
                p: 3,
                background: 'linear-gradient(135deg, rgba(45,27,78,0.95) 0%, rgba(74,29,110,0.95) 100%)',
                borderRadius: 3,
                border: '3px solid #ff6b9d',
                mb: 3,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -50,
                  left: -50,
                  right: -50,
                  bottom: -50,
                  background: 'radial-gradient(circle, rgba(255,107,157,0.1) 0%, transparent 70%)',
                  animation: 'pulse-bg 3s ease-in-out infinite',
                }}
              />
              
              <Stack direction="row" spacing={3} alignItems="center" justifyContent="center">
                <Box sx={{ position: 'relative' }}>
                  <CircularCountdown time={remainingTime} maxTime={60} />
                </Box>
                
                <Box sx={{ flex: 1, textAlign: 'center' }}>
                  <Typography
                    sx={{
                      fontSize: '1.5rem',
                      color: '#fff',
                      lineHeight: 1.8,
                      animation: 'text-glow 0.5s ease',
                      textShadow: '0 0 20px rgba(255, 107, 157, 0.5)',
                    }}
                  >
                    馃幍 "{roomState.currentQuote}"
                  </Typography>
                  {roomState.gameMode === GameMode.Judge && currentCharacter && (
                    <Typography sx={{ mt: 1, color: '#c77dff', fontStyle: 'italic' }}>
                      鈥?鏉ヨ嚜銆妠currentCharacter.anime}銆?
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Paper>
            
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: 2,
                p: 2,
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 3,
                minHeight: 400,
              }}
            >
              {deckCards.map((character) => {
                const pickers = roomState.currentTurnPicks.filter(p => p.cardId === character.id);
                const hasCorrectPick = pickers.some(p => p.isCorrect);
                
                return (
                  <Box key={character.id} sx={{ position: 'relative' }}>
                    <CharacterCard
                      character={character}
                      raised={selectedCard?.id === character.id}
                      disabled={myPlayer?.isLocked || false || myPlayer?.isObserver}
                      correct={hasCorrectPick}
                      wrong={selectedCard?.id === character.id && character.id !== roomState.currentCharacterId}
                      onClick={() => handleCardClick(character)}
                    />
                    {pickers.length > 0 && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          display: 'flex',
                          gap: 0.5,
                        }}
                      >
                        {pickers.map((pick, idx) => {
                          const picker = roomState.players.find(p => p.id === pick.playerId);
                          return (
                            <Avatar
                              key={idx}
                              sx={{
                                width: 24,
                                height: 24,
                                bgcolor: pick.isCorrect ? '#4ade80' : '#ff4757',
                                fontSize: '0.7rem',
                                border: '2px solid #fff',
                              }}
                            >
                              {picker?.name.charAt(0).toUpperCase()}
                            </Avatar>
                          );
                        })}
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
            
            {roomState.currentTurnPicks.length > 0 && (
              <Paper
                sx={{
                  p: 2,
                  mt: 2,
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: 2,
                }}
              >
                <Typography sx={{ color: '#ffc2d1', fontSize: '0.9rem', mb: 1 }}>
                  鏈洖鍚堥€夋嫨:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {roomState.currentTurnPicks.map((pick, idx) => {
                    const picker = roomState.players.find(p => p.id === pick.playerId);
                    const pickedCard = deckCards.find(c => c.id === pick.cardId);
                    return (
                      <Chip
                        key={idx}
                        data-testid="turn-pick-chip"
                        avatar={
                          <Avatar sx={{ bgcolor: pick.isCorrect ? '#4ade80' : '#ff4757' }}>
                            {picker?.name.charAt(0).toUpperCase()}
                          </Avatar>
                        }
                        label={`${picker?.name} 閫変簡 "${pickedCard?.name || '鏈煡'}" ${pick.isCorrect ? '鉁? : '鉁?}`}
                        sx={{
                          bgcolor: pick.isCorrect ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255, 71, 87, 0.2)',
                          color: pick.isCorrect ? '#4ade80' : '#ff4757',
                        }}
                      />
                    );
                  })}
                </Stack>
              </Paper>
            )}
          </Box>
        )}
        
        {roomState.gamePhase === GamePhase.GameEnd && (
          <Box sx={{ maxWidth: 600, mx: 'auto' }}>
            <Paper
              sx={{
                p: 4,
                background: 'linear-gradient(135deg, rgba(45,27,78,0.95) 0%, rgba(74,29,110,0.95) 100%)',
                borderRadius: 4,
                border: '3px solid #ff6b9d',
                textAlign: 'center',
              }}
            >
              <Typography
                variant="h3"
                sx={{
                  fontFamily: '"ZCOOL KuaiLe", cursive',
                  mb: 3,
                  background: 'linear-gradient(45deg, #ffd700, #ff6b9d)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                馃帀 娓告垙缁撴潫 馃帀
              </Typography>
              
              {roomState.players
                .sort((a, b) => b.score - a.score)
                .map((player, index) => (
                  <Paper
                    key={player.id}
                    sx={{
                      p: 2,
                      mb: 2,
                      background: index === 0
                        ? 'linear-gradient(135deg, rgba(255,215,0,0.3) 0%, rgba(255,107,157,0.3) 100%)'
                        : 'rgba(255,255,255,0.1)',
                      border: index === 0 ? '2px solid #ffd700' : '1px solid rgba(255,255,255,0.2)',
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography sx={{ fontSize: '2rem' }}>
                        {index === 0 ? '馃' : index === 1 ? '馃' : index === 2 ? '馃' : `#${index + 1}`}
                      </Typography>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 'bold' }}>
                          {player.name}
                          {player.isHost && <Star sx={{ fontSize: 14, color: '#ffd700', ml: 0.5 }} />}
                        </Typography>
                        <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                          <Typography sx={{ fontSize: '0.8rem', color: '#ffc2d1' }}>
                            寰楀垎: <span style={{ color: '#ffd700' }}>{player.score}</span>
                          </Typography>
                          <Typography sx={{ fontSize: '0.8rem', color: '#ffc2d1' }}>
                            鏈€楂樿繛鍑? <span style={{ color: '#c77dff' }}>{player.maxCombo}</span>
                          </Typography>
                          <Typography sx={{ fontSize: '0.8rem', color: '#ffc2d1' }}>
                            姝ｇ‘鐜? <span style={{ color: '#4ade80' }}>
                              {player.correctCount + player.wrongCount > 0
                                ? Math.round((player.correctCount / (player.correctCount + player.wrongCount)) * 100)
                                : 0}%
                            </span>
                          </Typography>
                        </Stack>
                      </Box>
                    </Stack>
                  </Paper>
                ))}
              
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={async () => {
                  if (isSupabaseConfigured()) {
                    await roomService.deleteRoom(roomState.roomId);
                  } else {
                    roomSync.deleteRoom(roomState.roomId);
                  }
                  setRoomState({
                    roomId: '',
                    hostId: 0,
                    players: [],
                    gameMode: GameMode.AutoRandom,
                    gamePhase: GamePhase.Lobby,
                    currentCharacterId: null,
                    currentQuote: null,
                    turnStartTime: null,
                    pickEvents: [],
                    deckRows: 3,
                    deckColumns: 8,
                    playbackSetting: {
                      countdown: false,
                      randomStartPosition: false,
                      playbackDuration: 0,
                    },
                    paused: false,
                    pausedTimeRemaining: 0,
                    customCards: [],
                    deckType: 'anime2026',
                    deckCards: [],
                    currentTurnPicks: [],
                    createdAt: Date.now(),
                  });
                  setViewMode('lobby');
                  setDeckCards([]);
                }}
                sx={{
                  mt: 3,
                  background: 'linear-gradient(45deg, #ff6b9d, #c77dff)',
                  py: 1.5,
                }}
              >
                杩斿洖澶у巺
              </Button>
            </Paper>
          </Box>
        )}
        
        <Dialog open={showSettingsDialog} onClose={() => setShowSettingsDialog(false)}>
          <DialogTitle>娓告垙璁剧疆</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1, minWidth: 300 }}>
              <Box>
                <Typography gutterBottom>闊抽噺</Typography>
                <Slider
                  value={volume * 100}
                  onChange={(_, v) => setVolume(v as number / 100)}
                />
              </Box>
              <Box>
                <Typography gutterBottom>鐗岀粍澶у皬: {roomState.deckRows}琛?脳 {roomState.deckColumns}鍒?/Typography>
                <Stack direction="row" spacing={2}>
                  <Slider
                    value={roomState.deckRows}
                    onChange={(_, v) => setRoomState(prev => ({ ...prev, deckRows: v as number }))}
                    min={2}
                    max={5}
                    marks
                    sx={{ flex: 1 }}
                  />
                  <Slider
                    value={roomState.deckColumns}
                    onChange={(_, v) => setRoomState(prev => ({ ...prev, deckColumns: v as number }))}
                    min={4}
                    max={12}
                    marks
                    sx={{ flex: 1 }}
                  />
                </Stack>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowSettingsDialog(false)}>鍏抽棴</Button>
          </DialogActions>
        </Dialog>
        
        <Dialog open={showSaveDeckDialog} onClose={() => setShowSaveDeckDialog(false)}>
          <DialogTitle>淇濆瓨鐗岀粍</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1, minWidth: 300 }}>
              <TextField
                label="鐗岀粍鍚嶇О"
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                fullWidth
                placeholder="渚嬪锛氭垜鐨勬渶鐖?
              />
              <TextField
                label="鐗岀粍鎻忚堪锛堝彲閫夛級"
                value={newDeckDescription}
                onChange={(e) => setNewDeckDescription(e.target.value)}
                fullWidth
                multiline
                rows={2}
                placeholder="绠€鍗曟弿杩拌繖涓墝缁?.."
              />
              <Typography sx={{ fontSize: '0.8rem', color: '#888' }}>
                灏嗕繚瀛?{roomState.customCards.length} 寮犲崱鐗?
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowSaveDeckDialog(false)}>鍙栨秷</Button>
            <Button onClick={saveCurrentDeck} variant="contained">淇濆瓨</Button>
          </DialogActions>
        </Dialog>
        
        <Dialog open={showGlobalDecksDialog} onClose={() => setShowGlobalDecksDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>鐗岀粍搴?/DialogTitle>
          <DialogContent>
            {globalDecks.length === 0 ? (
              <Typography sx={{ py: 4, textAlign: 'center', color: '#888' }}>
                鏆傛棤淇濆瓨鐨勭墝缁勶紝璇峰厛鍒涘缓骞朵繚瀛樿嚜瀹氫箟鐗岀粍
              </Typography>
            ) : (
              <Stack spacing={2} sx={{ mt: 1 }}>
                {globalDecks.map((deck) => (
                  <Paper
                    key={deck.id}
                    sx={{
                      p: 2,
                      bgcolor: 'rgba(255,255,255,0.05)',
                      borderRadius: 2,
                      border: '1px solid rgba(255,107,157,0.2)',
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 'bold', color: '#ff6b9d' }}>
                          {deck.name}
                        </Typography>
                        {deck.description && (
                          <Typography sx={{ fontSize: '0.8rem', color: '#888', mt: 0.5 }}>
                            {deck.description}
                          </Typography>
                        )}
                        <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                          <Typography sx={{ fontSize: '0.75rem', color: '#666' }}>
                            {deck.cards.length} 寮犲崱鐗?
                          </Typography>
                          <Typography sx={{ fontSize: '0.75rem', color: '#666' }}>
                            鍒涘缓鑰? {deck.createdBy}
                          </Typography>
                          <Typography sx={{ fontSize: '0.75rem', color: '#666' }}>
                            浣跨敤娆℃暟: {deck.playCount}
                          </Typography>
                        </Stack>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => loadGlobalDeck(deck)}
                          sx={{ bgcolor: '#c77dff' }}
                        >
                          浣跨敤
                        </Button>
                        <IconButton
                          size="small"
                          onClick={() => deleteGlobalDeck(deck.id)}
                          sx={{ color: '#ff4757' }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowGlobalDecksDialog(false)}>鍏抽棴</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
}
