export type UserRole = 'user' | 'admin';

export type ItemType = 'task' | 'event' | 'note' | 'data' | 'url';

export type TaskStatus = 'pending' | 'in-progress' | 'blocked' | 'completed';

export interface Profile {
  id: string;
  phone: string | null;
  email: string | null;
  role: UserRole;
  created_at: string;
}

export interface Item {
  id: string;
  user_id: string;
  raw_text: string;
  type: ItemType;
  title: string | null;
  description: string | null;
  due_date: string | null;
  priority: string;
  status: string;
  tags: string[];
  entities: Record<string, any>;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  url: string | null;
  url_title: string | null;
  url_summary: string | null;
  url_thumbnail: string | null;
  url_fetched_at: string | null;
  has_conflict: boolean;
  start_time: string | null;
  end_time: string | null;
  recurrence_rule: string | null;
  recurrence_end_date: string | null;
  master_item_id: string | null;
  is_master: boolean;
}

export interface AIProcessResult {
  type: ItemType;
  title: string;
  description: string;
  due_date: string | null;
  priority: string;
  tags: string[];
  entities: Record<string, any>;
  url?: string;
  url_title?: string;
  url_summary?: string;
  url_thumbnail?: string;
  start_time?: string | null;
  end_time?: string | null;
}

export interface TagStats {
  tag: string;
  count: number;
  lastUsed: string;
}

export interface URLFetchResult {
  url: string;
  title: string;
  summary: string;
  thumbnail?: string;
  content: string;
}

export interface QueryIntent {
  isQuery: boolean;
  queryType?: 'today' | 'upcoming' | 'week' | 'month' | 'type' | 'tag' | 'general';
  timeRange?: {
    start: string;
    end: string;
  };
  itemType?: ItemType;
  tags?: string[];
  keywords?: string[];
}

export interface QueryResult {
  items: Item[];
  summary: string;
  count: number;
}
