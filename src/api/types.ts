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

export interface AbilityScoresDto {
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
  abilities: AbilityScoresDto;
}

export interface CharacterResponse {
  id: string;
  name: string;
  ruleset: string;
  charClass: string;
  lineage: string;
  heritage: string;
  culture: string;
  level: number;
  abilities: AbilityScoresDto;
}
