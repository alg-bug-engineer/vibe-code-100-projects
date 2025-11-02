export type UserRole = 'user' | 'admin';

export type ItemType = 'task' | 'event' | 'note' | 'data' | 'url' | 'collection';

export type TaskStatus = 'pending' | 'in-progress' | 'blocked' | 'completed';

export type SubItemStatus = 'pending' | 'done';

export interface SubItem {
  id: string;
  text: string;
  status: SubItemStatus;
}

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
  // 集合类型专用字段
  collection_type?: string | null;
  sub_items?: SubItem[];
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

// 智能模板相关类型
export interface UserTemplate {
  id: string;
  user_id: string;
  trigger_word: string;
  template_name: string;
  icon: string;
  collection_type: string;
  default_tags: string[];
  default_sub_items: SubItem[];
  color?: string | null;
  is_active: boolean;
  sort_order: number;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateFormData {
  trigger_word: string;
  template_name: string;
  icon: string;
  collection_type: string;
  default_tags: string[];
  default_sub_items: SubItem[];
  color?: string;
}
