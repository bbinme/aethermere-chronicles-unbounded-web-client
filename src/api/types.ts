// Type definitions mirroring the GMS DTOs (Java records under
// client/src/main/java/org/aethermere/cu/client/api/dto/). Field names match
// the JSON wire format produced by Jackson default serialization.

// ---------- Auth ----------

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  /** Access token (JWT). The refresh token is delivered as an HttpOnly cookie. */
  accessToken: string;
}

// ---------- Rulesets ----------

export interface RulesetSummary {
  key: string;
  name: string;
  description: string;
}

export interface HeritageResponse {
  key: string;
  displayName: string;
  description: string;
  isDefault: boolean;
}

export interface LineageResponse {
  key: string;
  displayName: string;
  description: string;
  heritages: HeritageResponse[];
}

export interface ClassResponse {
  key: string;
  displayName: string;
  description: string;
  /** Hit-die size (e.g. 6, 8, 10, 12). Optional during GMS rollout. */
  hitDie?: number;
}

export interface CultureResponse {
  key: string;
  displayName: string;
  description: string;
}

export interface LineagesWrapper {
  term: string;
  lineages: LineageResponse[];
}

export interface ClassesWrapper {
  term: string;
  classes: ClassResponse[];
}

export interface CulturesWrapper {
  term: string;
  cultures: CultureResponse[];
}

// ---------- Characters ----------

/**
 * Plain ability-score map used by the wizard's create payload (numbers).
 * The read-side response uses CharacterAbilityScoresDto with per-ability objects.
 */
export interface AbilityScoresInputDto {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface CharacterCreateRequest {
  name: string;
  /** Ruleset key. */
  ruleset: string;
  /** Lineage key. */
  lineage: string;
  /** Heritage key. */
  heritage: string;
  /**
   * Class key. Named `charClass` because `class` is a reserved word in Java
   * (the Java DTO uses `charClass` and Jackson serializes it as-is on the wire).
   */
  charClass: string;
  /** Culture key. */
  culture: string;
  gender: string;
  abilities: AbilityScoresInputDto;
}

export interface NamedRefDto {
  key: string;
  name: string;
}

export interface AbilityScoreDto {
  score: number;
  /** Pre-formatted modifier with sign, e.g. "+1", "-1", "+0". */
  modifier: string;
  /** Pre-formatted point-buy bonus with sign. */
  pointBuyBonus: string;
}

export interface CharacterAbilityScoresDto {
  strength: AbilityScoreDto;
  dexterity: AbilityScoreDto;
  constitution: AbilityScoreDto;
  intelligence: AbilityScoreDto;
  wisdom: AbilityScoreDto;
  charisma: AbilityScoreDto;
}

export interface HitPointsDto {
  max: number;
  current: number;
  temp: number;
}

// ---------- Worlds ----------

export interface WorldSummary {
  id: string;
  sessionId: string;
  width: number;
  height: number;
  partyStartCol: number;
  partyStartRow: number;
  status: string;
  latitudeBand: number;
  longitudeSlot: number;
  souEnabled: boolean;
}

export type ShroudState = 'UNKNOWN' | 'SHROUDED' | 'REVEALED';

export interface TileResponse {
  col: number;
  row: number;
  shroudState: ShroudState;
  biome: string | null;
  pointOfInterest?: string | null;
  elevation?: number | null;
  riverType?: number | null;
  riverCrossing?: number | null;
  tileName?: string | null;
  townSizeTier?: number | null;
  rumours?: unknown[];
  controllingFactionId?: string | null;
  contested?: boolean | null;
  stabilityScore?: number | null;
  foundingRace?: string | null;
  resource?: number | null;
  allegiances?: unknown[];
  settlementId?: string | null;
}

export interface PlayerPositionDto {
  playerId: string;
  col: number;
  row: number;
}

export interface WorldResponse {
  id: string;
  sessionId: string;
  width: number;
  height: number;
  partyStartCol: number;
  partyStartRow: number;
  turnNumber: number;
  players: PlayerPositionDto[];
  tiles: TileResponse[];
  factions?: unknown[];
}

export interface PlayerTileDeltaDto {
  playerId: string;
  delta: TileResponse[];
}

export interface MoveResponse {
  col: number;
  row: number;
  turnNumber: number;
  ownDelta: TileResponse[];
  otherDeltas: PlayerTileDeltaDto[];
  partyPositions: PlayerPositionDto[];
  /** Phase-2 unused; reserved for phase 3+. */
  resolvedRumour?: unknown;
  encounterStarted?: unknown;
  dungeonId?: string | null;
}

export interface WorldDeltaResponse {
  tiles: TileResponse[];
  partyPositions: PlayerPositionDto[];
  turnNumber: number;
  isFull: boolean;
}

// ---------- Settlements / Towns / DM ----------

export type CharacterLocationKind = 'OVERWORLD' | 'TOWN' | 'DUNGEON' | 'BUILDING';

export interface CharacterLocationResponse {
  worldId: string;
  characterId: string;
  kind: CharacterLocationKind;
  overworld: { col: number; row: number } | null;
  town: { settlementId: string } | null;
  dungeon: {
    dungeonId: string;
    levelId: string;
    col: number;
    row: number;
  } | null;
  building: { settlementId: string; buildingId: string } | null;
  currentEncounterId: string | null;
  updatedAt: string;
}

export interface SettlementSummary {
  id: string;
  worldMapId: string;
  col: number;
  row: number;
  name: string;
  tier: string;
  lineageKey: string;
  industry: string;
  population: number;
  description: string | null;
  createdAt: string;
}

export interface DmMessage {
  id: number;
  role: 'DM' | 'PLAYER';
  playerId: string;
  content: string;
  createdAt: string;
}

export interface DmConversationResponse {
  conversationId: string;
  sessionId: string;
  worldId: string;
  channelType: string;
  playerId: string;
  isActive: boolean;
  createdAt: string;
  lastMessageAt: string;
}

export interface DmMessageHistoryResponse {
  messages: DmMessage[];
  hasMore: boolean;
}

export interface DmMessagePairResponse {
  playerMessage: DmMessage;
  dmResponse: DmMessage;
}

export interface CharacterResponse {
  id: string;
  playerId: string;
  name: string;
  ruleset: string;
  characterClass: string;
  subclass: string | null;
  level: number;
  background: string | null;
  alignment: string | null;
  lineage: NamedRefDto | null;
  heritage: NamedRefDto | null;
  culture: NamedRefDto | null;
  abilityScores: CharacterAbilityScoresDto;
  hitPoints?: HitPointsDto;
}
