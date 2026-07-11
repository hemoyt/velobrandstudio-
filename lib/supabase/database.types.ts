// Hand-written to match supabase/migrations/*.sql.
// Regenerate with `supabase gen types typescript` once you have a live project
// if you add columns/tables and want the generated version instead.
//
// Every table includes `Relationships: []` even though we don't use embedded
// resource selects — @supabase/postgrest-js's GenericTable type requires it
// structurally, and omitting it silently collapses Row/Insert/Update to `never`.

export type TeamRole = 'owner' | 'admin' | 'editor' | 'viewer';
export type AiProvider = 'openai' | 'gemini';
export type ProjectStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'ARCHIVED';
export type AssetType = 'logo' | 'mockup' | 'social_post' | 'business_card' | 'social_template';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; email: string; display_name: string | null; created_at: string };
        Insert: { id: string; email: string; display_name?: string | null };
        Update: Partial<{ display_name: string | null }>;
        Relationships: [];
      };
      teams: {
        Row: { id: string; name: string; slug: string; created_by: string; created_at: string };
        Insert: { id?: string; name: string; slug: string; created_by: string; created_at?: string };
        Update: Partial<{ name: string; slug: string }>;
        Relationships: [];
      };
      team_members: {
        Row: {
          team_id: string;
          user_id: string;
          role: TeamRole;
          invited_by: string | null;
          joined_at: string;
        };
        Insert: {
          team_id: string;
          user_id: string;
          role?: TeamRole;
          invited_by?: string | null;
        };
        Update: Partial<{ role: TeamRole }>;
        Relationships: [
          {
            foreignKeyName: 'team_members_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
        ];
      };
      invites: {
        Row: {
          id: string;
          team_id: string;
          email: string;
          role: TeamRole;
          token: string;
          invited_by: string | null;
          expires_at: string;
          accepted_at: string | null;
        };
        Insert: {
          id?: string;
          team_id: string;
          email: string;
          role?: TeamRole;
          invited_by?: string | null;
          expires_at?: string;
        };
        Update: Partial<{ accepted_at: string | null }>;
        Relationships: [];
      };
      provider_keys: {
        Row: {
          id: string;
          team_id: string;
          provider: AiProvider;
          encrypted_key: string;
          added_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          provider: AiProvider;
          encrypted_key: string;
          added_by?: string | null;
        };
        Update: Partial<{ encrypted_key: string }>;
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          team_id: string;
          client_name: string;
          industry: string;
          brief: string | null;
          status: ProjectStatus;
          share_token: string | null;
          selected_logo_asset_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          client_name: string;
          industry?: string;
          brief?: string | null;
          status?: ProjectStatus;
          share_token?: string | null;
          selected_logo_asset_id?: string | null;
          created_by?: string | null;
        };
        Update: Partial<{
          client_name: string;
          industry: string;
          brief: string | null;
          status: ProjectStatus;
          share_token: string | null;
          selected_logo_asset_id: string | null;
        }>;
        Relationships: [];
      };
      project_shares: {
        Row: { project_id: string; user_id: string; role_override: TeamRole | null };
        Insert: { project_id: string; user_id: string; role_override?: TeamRole | null };
        Update: Partial<{ role_override: TeamRole | null }>;
        Relationships: [];
      };
      brand_identities: {
        Row: {
          project_id: string;
          business_name: string | null;
          description: string | null;
          color_palette: string[];
          typography: { heading?: string; body?: string };
          brand_voice: string | null;
          tagline: string | null;
          target_audience: string | null;
          updated_at: string;
        };
        Insert: {
          project_id: string;
          business_name?: string | null;
          description?: string | null;
          color_palette?: string[];
          typography?: { heading?: string; body?: string };
          brand_voice?: string | null;
          tagline?: string | null;
          target_audience?: string | null;
        };
        Update: Partial<{
          business_name: string | null;
          description: string | null;
          color_palette: string[];
          typography: { heading?: string; body?: string };
          brand_voice: string | null;
          tagline: string | null;
          target_audience: string | null;
        }>;
        Relationships: [];
      };
      assets: {
        Row: {
          id: string;
          project_id: string;
          storage_path: string;
          type: AssetType;
          prompt: string | null;
          original_prompt: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          storage_path: string;
          type: AssetType;
          prompt?: string | null;
          original_prompt?: string | null;
          created_by?: string | null;
        };
        Update: Partial<{ storage_path: string; prompt: string | null }>;
        Relationships: [];
      };
      videos: {
        Row: {
          id: string;
          project_id: string;
          storage_path: string;
          prompt: string | null;
          has_sound: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          storage_path: string;
          prompt?: string | null;
          has_sound?: boolean;
          created_by?: string | null;
        };
        Update: Partial<{ storage_path: string }>;
        Relationships: [];
      };
      activity_log: {
        Row: {
          id: string;
          team_id: string;
          actor_id: string | null;
          action: string;
          target_type: string | null;
          target_id: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          actor_id?: string | null;
          action: string;
          target_type?: string | null;
          target_id?: string | null;
          metadata?: Record<string, unknown> | null;
        };
        Update: Partial<{ action: string }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      accept_invite: { Args: { p_token: string }; Returns: string };
      is_team_member: { Args: { p_team_id: string; p_min_role?: TeamRole }; Returns: boolean };
      can_access_project: { Args: { p_project_id: string; p_min_role?: TeamRole }; Returns: boolean };
    };
  };
}
