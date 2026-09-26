import type {
  RocketLeagueGame,
  RocketLeaguePlayer,
  UpdateState,
} from "./types";

export interface MatchState {
  connected: boolean;

  matchGuid: string | null;

  players: RocketLeaguePlayer[];

  game: RocketLeagueGame | null;

  lastUpdate: number;
}

type StateHandler = (
  state: MatchState
) => void;

type NewMatchHandler = (
  state: MatchState
) => void;

export class MatchStateManager {
  private state: MatchState = {
    connected: false,
    matchGuid: null,
    players: [],
    game: null,
    lastUpdate: 0,
  };

  private stateHandlers =
    new Set<StateHandler>();

  private newMatchHandlers =
    new Set<NewMatchHandler>();

  getState(): MatchState {
    return {
      ...this.state,
      players: [...this.state.players],
    };
  }

  setConnected(
    connected: boolean
  ) {
    this.state = {
      ...this.state,
      connected,
    };

    this.notifyState();
  }

  update(
    update: UpdateState
  ) {
    const isNewMatch =
      this.state.matchGuid !==
        null &&
      this.state.matchGuid !==
        update.MatchGuid;

    const firstMatch =
      this.state.matchGuid === null;

    this.state = {
      connected: this.state.connected,

      matchGuid:
        update.MatchGuid,

      players:
        update.Players,

      game:
        update.Game,

      lastUpdate:
        Date.now(),
    };

    if (
      firstMatch ||
      isNewMatch
    ) {
      this.notifyNewMatch();
    }

    this.notifyState();
  }

  onState(
    handler: StateHandler
  ) {
    this.stateHandlers.add(
      handler
    );

    return () => {
      this.stateHandlers.delete(
        handler
      );
    };
  }

  onNewMatch(
    handler: NewMatchHandler
  ) {
    this.newMatchHandlers.add(
      handler
    );

    return () => {
      this.newMatchHandlers.delete(
        handler
      );
    };
  }

  private notifyState() {
    const state =
      this.getState();

    for (
      const handler
      of this.stateHandlers
    ) {
      handler(state);
    }
  }

  private notifyNewMatch() {
    const state =
      this.getState();

    for (
      const handler
      of this.newMatchHandlers
    ) {
      handler(state);
    }
  }
}