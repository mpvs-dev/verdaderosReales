import { memo, useMemo } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import useGameRoom from "./hooks/useGameRoom";
import MenuScreen from "./components/MenuScreen";
import LobbyScreen from "./components/LobbyScreen";
import PlayingScreen from "./components/PlayingScreen";
import CreateQuestionScreen from "./components/CreateQuestionScreen";
import { KingPickScreen, KingRevealScreen } from "./components/KingScreens";
import { ResultsScreen, WaitingForQuestionScreen } from "./components/EndScreens";
import RoundReviewScreen from "./components/RoundReviewScreen";
import Toast from "./components/Toast";
import EmptyRoomBanner from "./components/EmptyRoomBanner";
import InactivityModal from "./components/InactivityModal";
import { GAME_STATE, PLAYER_ROLE } from "./constants/game.js";
import "./styles/game.css";
import ReconnectingOverlay from "./components/ReconnectingOverlay.jsx";

export default function App() {
  const room = useGameRoom();

  const effectiveRole =
    room.playerRole === PLAYER_ROLE.ADMIN_KING
      ? PLAYER_ROLE.KING
      : room.playerRole;

  const showEmptyBanner =
    room.emptyRoom &&
    (room.gameState === GAME_STATE.LOBBY ||
      room.gameState === GAME_STATE.PLAYING);

  const menuProps = useMemo(
    () => ({
      playerName: room.playerName,
      roomCode: room.roomCode,
      loadingCreate: room.loadingCreate,
      loadingJoin: room.loadingJoin,
      setPlayerName: room.setPlayerName,
      setRoomCode: room.setRoomCode,
      createRoom: room.createRoom,
      joinRoom: room.joinRoom,
    }),
    [
      room.playerName,
      room.roomCode,
      room.loading,
      room.setPlayerName,
      room.setRoomCode,
      room.createRoom,
      room.joinRoom,
    ],
  );

  const lobbyProps = useMemo(
    () => ({
      roomCode: room.roomCode,
      playerRole: room.playerRole,
      gameConfig: room.gameConfig,
      setGameConfig: room.setGameConfig,
      // Solo los campos de currentRoom que usa LobbyScreen
      currentRoom: room.currentRoom
        ? {
            config: room.currentRoom.config,
            aspirants: room.currentRoom.aspirants,
            admin: room.currentRoom.admin,
            king: room.currentRoom.king,
          }
        : null,
      startGame: room.startGame,
      updateRoomConfig: room.updateRoomConfig,
      resetGame: room.resetGame,
    }),
    [
      room.roomCode,
      room.playerRole,
      room.gameConfig,
      room.setGameConfig,
      room.currentRoom?.config,
      room.currentRoom?.aspirants,
      room.currentRoom?.admin,
      room.currentRoom?.king,
      room.startGame,
      room.updateRoomConfig,
      room.resetGame,
    ],
  );

  const kingPickProps = useMemo(
    () => ({
      playerRole: room.playerRole,
      roomCode: room.roomCode,
      currentRoom: room.currentRoom
        ? {
            admin: room.currentRoom.admin,
            aspirants: room.currentRoom.aspirants,
            pickingAnimation: room.currentRoom.pickingAnimation,
          }
        : null,
      pickKing: room.pickKing,
      pickRandomKing: room.pickRandomKing,
      resetGame: room.resetGame,
    }),
    [
      room.playerRole,
      room.roomCode,
      room.currentRoom?.admin,
      room.currentRoom?.aspirants,
      room.currentRoom?.pickingAnimation,
      room.pickKing,
      room.pickRandomKing,
      room.resetGame,
    ],
  );

  const kingRevealProps = useMemo(
    () => ({
      playerRole: room.playerRole,
      playerName: room.playerName,
      currentRoom: room.currentRoom
        ? {
            king: room.currentRoom.king,
            admin: room.currentRoom.admin,
            aspirants: room.currentRoom.aspirants,
          }
        : null,
      confirmKingAndStart: room.confirmKingAndStart,
      resetGame: room.resetGame,
    }),
    [
      room.playerRole,
      room.playerName,
      room.currentRoom?.king,
      room.currentRoom?.admin,
      room.currentRoom?.aspirants,
      room.confirmKingAndStart,
      room.resetGame,
    ],
  );

  const playingProps = useMemo(
    () => ({
      currentRoom: room.currentRoom,
      playerRole: effectiveRole,
      playerName: room.playerName,
      answeredQuestions: room.answeredQuestions,
      submitAnswer: room.submitAnswer,
      validateAnswer: room.validateAnswer,
      resetGame: room.resetGame,
    }),
    [
      room.currentRoom,
      effectiveRole,
      room.playerName,
      room.answeredQuestions,
      room.submitAnswer,
      room.validateAnswer,
      room.resetGame,
    ],
  );

  const roundReviewProps = useMemo(
    () => ({
      playerRole: room.playerRole,
      playerName: room.playerName,
      currentRoom: room.currentRoom
        ? {
            roundSnapshot: room.currentRoom.roundSnapshot,
            roundReviewEndsAt: room.currentRoom.roundReviewEndsAt,
            scores: room.currentRoom.scores,
            questions: room.currentRoom.questions,
            currentQuestionIndex: room.currentRoom.currentQuestionIndex,
            config: room.currentRoom.config,
            aspirants: room.currentRoom.aspirants,
            admin: room.currentRoom.admin,
            king: room.currentRoom.king,
          }
        : null,
      advanceReview: room.advanceReview,
      resetGame: room.resetGame,
    }),
    [
      room.playerRole,
      room.playerName,
      room.currentRoom?.roundSnapshot,
      room.currentRoom?.roundReviewEndsAt,
      room.currentRoom?.scores,
      room.currentRoom?.questions,
      room.currentRoom?.currentQuestionIndex,
      room.currentRoom?.config,
      room.currentRoom?.aspirants,
      room.currentRoom?.admin,
      room.currentRoom?.king,
      room.advanceReview,
      room.resetGame,
    ],
  );

  const resultsProps = useMemo(
    () => ({
      playerRole: room.playerRole,
      currentRoom: room.currentRoom
        ? {
            scores: room.currentRoom.scores,
            answers: room.currentRoom.answers,
            questions: room.currentRoom.questions,
            king: room.currentRoom.king,
            admin: room.currentRoom.admin,
            aspirants: room.currentRoom.aspirants,
            startedAt: room.currentRoom.startedAt,
            finishedAt: room.currentRoom.finishedAt,
          }
        : null,
      rematch: room.rematch,
      resetGame: room.resetGame,
    }),
    [
      room.playerRole,
      room.currentRoom?.scores,
      room.currentRoom?.answers,
      room.currentRoom?.questions,
      room.currentRoom?.king,
      room.currentRoom?.admin,
      room.currentRoom?.aspirants,
      room.currentRoom?.startedAt,
      room.currentRoom?.finishedAt,
      room.rematch,
      room.resetGame,
    ],
  );

  const createQuestionProps = useMemo(
    () => ({
      currentRoom: room.currentRoom,
      playerRole: effectiveRole,
      submitCustomQuestion: room.submitCustomQuestion,
      resetGame: room.resetGame,
    }),
    [
      room.currentRoom,
      effectiveRole,
      room.submitCustomQuestion,
      room.resetGame,
    ],
  );

  const waitingQuestionProps = useMemo(
    () => ({
      currentRoom: room.currentRoom
        ? {
            king: room.currentRoom.king,
            scores: room.currentRoom.scores,
            config: room.currentRoom.config,
            aspirants: room.currentRoom.aspirants,
            admin: room.currentRoom.admin,
            currentQuestionIndex: room.currentRoom.currentQuestionIndex,
          }
        : null,
      resetGame: room.resetGame,
    }),
    [
      room.currentRoom?.king,
      room.currentRoom?.scores,
      room.currentRoom?.config,
      room.currentRoom?.aspirants,
      room.currentRoom?.admin,
      room.currentRoom?.currentQuestionIndex,
      room.resetGame,
    ],
  );

  // ── Screens ────────────────────────────────────────────────────────────
  const screens = {
    [GAME_STATE.MENU]: <MemoMenuScreen {...menuProps} />,
    [GAME_STATE.LOBBY]: <MemoLobbyScreen {...lobbyProps} />,
    [GAME_STATE.PICKING_KING]: <MemoKingPickScreen {...kingPickProps} />,
    [GAME_STATE.KING_REVEAL]: <MemoKingRevealScreen {...kingRevealProps} />,
    [GAME_STATE.PLAYING]: <MemoPlayingScreen {...playingProps} />,
    [GAME_STATE.RESULTS]: <MemoResultsScreen {...resultsProps} />,
    [GAME_STATE.CREATING_QUESTION]: (
      <MemoCreateQuestionScreen {...createQuestionProps} />
    ),
    [GAME_STATE.WAITING_QUESTION]: (
      <MemoWaitingForQuestionScreen {...waitingQuestionProps} />
    ),
    [GAME_STATE.ROUND_REVIEW]: <MemoRoundReviewScreen {...roundReviewProps} />,
  };

  return (
    <>
      <Analytics />
      <SpeedInsights />
      <Toast toasts={room.toasts} onDismiss={room.dismiss} />
      <EmptyRoomBanner visible={showEmptyBanner} />
      <InactivityModal
        visible={room.inactive}
        onClose={room.resetTimer}
        onEndRoom={room.resetGame}
      />
      <ReconnectingOverlay visible={room.reconnecting} />
      {screens[room.gameState] ?? null}
    </>
  );
}

// ── Versiones memorizadas ───────────────────────────────────────────────────
const MemoMenuScreen = memo(MenuScreen);
const MemoLobbyScreen = memo(LobbyScreen);
const MemoKingPickScreen = memo(KingPickScreen);
const MemoKingRevealScreen = memo(KingRevealScreen);
const MemoPlayingScreen = memo(PlayingScreen);
const MemoResultsScreen = memo(ResultsScreen);
const MemoCreateQuestionScreen = memo(CreateQuestionScreen);
const MemoWaitingForQuestionScreen = memo(WaitingForQuestionScreen);
const MemoRoundReviewScreen = memo(RoundReviewScreen);
