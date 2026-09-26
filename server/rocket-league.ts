import {
    RocketLeagueClient,
  } from "../app/lib/rocket-league/client";
  
  import {
    MatchStateManager,
  } from "../app/lib/rocket-league/state";
  
  import type {
    UpdateState,
  } from "../app/lib/rocket-league/types";
  
  export class RocketLeagueService {
    readonly client:
      RocketLeagueClient;
  
    readonly state:
      MatchStateManager;
  
    constructor() {
      this.client =
        new RocketLeagueClient();
  
      this.state =
        new MatchStateManager();
  
      this.setup();
    }
  
    private setup() {
      this.client.on(
        "connected",
        () => {
          console.log(
            "[RocketLeague] Service connected"
          );
  
          this.state.setConnected(
            true
          );
        }
      );
  
      this.client.on(
        "disconnected",
        () => {
          console.log(
            "[RocketLeague] Service disconnected"
          );
  
          this.state.setConnected(
            false
          );
        }
      );
  
      this.client.on(
        "UpdateState",
        (data) => {
          this.state.update(
            data as UpdateState
          );
        }
      );
  
      this.state.onNewMatch(
        (state) => {
          console.log(
            "\n[RocketLeague] New match detected"
          );
  
          console.log(
            "[RocketLeague] MatchGuid:",
            state.matchGuid
          );
  
          console.log(
            "[RocketLeague] Players:",
            state.players.map(
              (player) =>
                `${player.Name} (${player.PrimaryId})`
            )
          );
  
          console.log(
            "[RocketLeague] Arena:",
            state.game?.Arena
          );
  
          console.log(
            "[RocketLeague] Playlist:",
            state.game?.PlaylistId
          );
        }
      );
    }
  
    start() {
      console.log(
        "[RocketLeague] Starting service..."
      );
  
      this.client.connect();
    }
  
    stop() {
      this.client.disconnect();
    }
  }
  
  declare global {
    // eslint-disable-next-line no-var
    var rocketLeagueService:
      | RocketLeagueService
      | undefined;
  }
  
  export function
    getRocketLeagueService() {
  
    if (
      !globalThis.rocketLeagueService
    ) {
      globalThis.rocketLeagueService =
        new RocketLeagueService();
  
      globalThis
        .rocketLeagueService
        .start();
    }
  
    return globalThis
      .rocketLeagueService;
  }