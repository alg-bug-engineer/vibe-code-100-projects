/**
 * 时间冲突检测工具
 * 用于检测日程事项之间的时间重叠和冲突
 */

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface ConflictItem {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
}

/**
 * 检测两个时间段是否有冲突（重叠）
 * 
 * 冲突判定规则：
 * - A的开始时间在B的时间范围内
 * - A的结束时间在B的时间范围内
 * - A完全包含B
 * - B完全包含A
 * 
 * @param range1 第一个时间范围
 * @param range2 第二个时间范围
 * @returns 是否存在冲突
 */
export function hasTimeConflict(range1: TimeRange, range2: TimeRange): boolean {
  const start1 = range1.start.getTime();
  const end1 = range1.end.getTime();
  const start2 = range2.start.getTime();
  const end2 = range2.end.getTime();

  // 检测各种重叠情况
  return (
    // range1 的开始时间在 range2 范围内
    (start1 >= start2 && start1 < end2) ||
    // range1 的结束时间在 range2 范围内
    (end1 > start2 && end1 <= end2) ||
    // range1 完全包含 range2
    (start1 <= start2 && end1 >= end2) ||
    // range2 完全包含 range1
    (start2 <= start1 && end2 >= end1)
  );
}

/**
 * 解析时间字符串为 Date 对象（处理时区问题）
 * 
 * @param dateTimeString ISO 格式的时间字符串
 * @returns Date 对象
 */
export function parseDateTime(dateTimeString: string): Date {
  // 如果字符串不包含时区信息，则当作本地时间解析
  if (!dateTimeString.includes('Z') && !dateTimeString.includes('+') && !dateTimeString.includes('T')) {
    return new Date(dateTimeString + 'T00:00:00');
  }
  
  if (!dateTimeString.includes('Z') && !dateTimeString.match(/[+-]\d{2}:\d{2}$/)) {
    const parts = dateTimeString.split(/[-T:]/);
    return new Date(
      parseInt(parts[0]), // year
      parseInt(parts[1]) - 1, // month (0-indexed)
      parseInt(parts[2]), // day
      parseInt(parts[3] || '0'), // hour
      parseInt(parts[4] || '0'), // minute
      parseInt(parts[5] || '0')  // second
    );
  }
  
  return new Date(dateTimeString);
}

/**
 * 检测一个事项与其他事项列表是否有时间冲突
 * 
 * @param item 要检测的事项
 * @param existingItems 已存在的事项列表
 * @param excludeItemId 排除的事项ID（用于更新时排除自身）
 * @returns 冲突的事项列表
 */
export function detectConflicts(
  item: { start_time: string | null; end_time: string | null },
  existingItems: ConflictItem[],
  excludeItemId?: string
): ConflictItem[] {
  // 如果没有开始时间和结束时间，不检测冲突
  if (!item.start_time || !item.end_time) {
    return [];
  }

  const itemStart = parseDateTime(item.start_time);
  const itemEnd = parseDateTime(item.end_time);
  const itemRange: TimeRange = { start: itemStart, end: itemEnd };

  const conflicts: ConflictItem[] = [];

  for (const existingItem of existingItems) {
    // 跳过要排除的项
    if (excludeItemId && existingItem.id === excludeItemId) {
      continue;
    }

    // 跳过没有时间信息的项
    if (!existingItem.start_time || !existingItem.end_time) {
      continue;
    }

    const existingStart = parseDateTime(existingItem.start_time);
    const existingEnd = parseDateTime(existingItem.end_time);
    const existingRange: TimeRange = { start: existingStart, end: existingEnd };

    // 检测冲突
    if (hasTimeConflict(itemRange, existingRange)) {
      conflicts.push(existingItem);
    }
  }

  return conflicts;
}

/**
 * 格式化冲突信息为用户友好的文本
 * 
 * @param conflicts 冲突的事项列表
 * @returns 格式化的冲突描述
 */
export function formatConflictMessage(conflicts: ConflictItem[]): string {
  if (conflicts.length === 0) {
    return '';
  }

  if (conflicts.length === 1) {
    return `与"${conflicts[0].title}"存在时间冲突`;
  }

  return `与 ${conflicts.length} 个事项存在时间冲突：${conflicts.map(c => c.title).join('、')}`;
}
