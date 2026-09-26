export interface RocketLeagueMessage<T = unknown> {
    Event: string;
    Data: T;
  }
  
  export interface RocketLeaguePlayer {
    Name: string;
    PrimaryId: string;
    Shortcut?: number;
  
    TeamNum: number;
  
    Score: number;
    Goals: number;
    Shots: number;
    Assists: number;
    Saves: number;
    Touches: number;
    CarTouches: number;
    Demos: number;
  
    Loadout?: string[];
  
    bHasCar?: boolean;
    Speed?: number;
    Boost?: number;
    bBoosting?: boolean;
    bOnGround?: boolean;
    bOnWall?: boolean;
    bPowersliding?: boolean;
    bDemolished?: boolean;
    bSupersonic?: boolean;
  
    PickupClass?: string;
  
    Attacker?: RocketLeaguePlayer;
  }
  
  export interface RocketLeagueTeam {
    Name: string;
    TeamNum: number;
    Score: number;
  
    ColorPrimary?: string;
    ColorSecondary?: string;
  }
  
  export interface RocketLeagueBall {
    Speed: number;
    TeamNum: number;
  }
  
  export interface RocketLeagueTarget {
    Name: string;
    Shortcut: number;
    TeamNum: number;
  }
  
  export interface RocketLeagueGame {
    Teams: RocketLeagueTeam[];
  
    PlaylistId: number;
  
    TimeSeconds: number;
  
    bOvertime: boolean;
  
    Frame?: number;
    Elapsed?: number;
  
    Ball: RocketLeagueBall;
  
    bReplay: boolean;
  
    bHasWinner: boolean;
    Winner?: string;
  
    Arena: string;
  
    bHasTarget: boolean;
    Target?: RocketLeagueTarget;
  }
  
  export interface UpdateState {
    MatchGuid: string;
    Players: RocketLeaguePlayer[];
    Game: RocketLeagueGame;
  }