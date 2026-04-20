export type Id = string;

export interface Person { id: Id; name: string; slug: string; }
export interface Organization { id: Id; name: string; slug: string; sort_order: number; }
export interface Calling { id: Id; organization_id: Id; title: string; sort_order: number; }

export interface MasterAssignment {
  calling_id: Id;
  person_id: Id;
  set_apart: boolean;
}

export interface DraftRow {
  id: Id;
  name: string;
  created_by: Id | null;
  created_at: string;
  based_on_master_at: string;
  archived: boolean;
}

export interface DraftAssignment {
  draft_id: Id;
  calling_id: Id;
  person_id: Id;
  called: boolean;
  sustained: boolean;
}

export interface DraftStaging { draft_id: Id; person_id: Id; }

export interface PromotionHistoryRow {
  id: Id;
  draft_name: string;
  promoted_at: string;
  promoted_by: Id | null;
  snapshot: Array<{
    calling_id: Id;
    calling_title: string;
    organization_name: string;
    person_id: Id;
    person_name: string;
    set_apart: boolean;
  }>;
}

export interface UserAccessRow {
  user_id: Id;
  ward_id: Id;
  display_name: string | null;
  granted_at: string;
}

// Ward id is hardcoded in the MVP (single-ward).
export const WARD_ID = '00000000-0000-0000-0000-000000000001';
