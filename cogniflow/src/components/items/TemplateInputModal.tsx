import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { UserTemplate, SubItem } from '@/types/types';

interface TemplateInputModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: UserTemplate;
  onSave: (data: {
    title: string;
    description: string;
    sub_items: SubItem[];
    tags: string[];
  }) => Promise<void>;
}

export function TemplateInputModal({
  open,
  onOpenChange,
  template,
  onSave,
}: TemplateInputModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subItems, setSubItems] = useState<SubItem[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newSubItemText, setNewSubItemText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 初始化表单数据
  useEffect(() => {
    if (open && template) {
      // 生成默认标题
      const now = new Date();
      const dateStr = `${now.getMonth() + 1}月${now.getDate()}日`;
      setTitle(`${dateStr} ${template.template_name}`);
      
      // 使用模板的默认子任务
      setSubItems(
        template.default_sub_items.map((item) => ({
          ...item,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        }))
      );
      
      // 使用模板的默认标签
      setTags([...template.default_tags]);
      
      setDescription('');
      setNewSubItemText('');
    }
  }, [open, template]);

  const handleAddSubItem = () => {
    if (!newSubItemText.trim()) {
      toast.error('请输入子任务内容');
      return;
    }

    const newItem: SubItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: newSubItemText.trim(),
      status: 'pending',
    };

    setSubItems([...subItems, newItem]);
    setNewSubItemText('');
  };

  const handleRemoveSubItem = (id: string) => {
    setSubItems(subItems.filter((item) => item.id !== id));
  };

  const handleToggleSubItem = (id: string) => {
    setSubItems(
      subItems.map((item) =>
        item.id === id
          ? { ...item, status: item.status === 'pending' ? 'done' : 'pending' }
          : item
      )
    );
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('请输入标题');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        sub_items: subItems,
        tags,
      });
      
      toast.success('保存成功');
      onOpenChange(false);
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{template.icon}</span>
            <span>记录{template.template_name}</span>
          </DialogTitle>
          <DialogDescription>
            填写内容后保存到智能仪表盘
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 标题输入 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">标题</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入标题..."
            />
          </div>

          {/* 子任务列表 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">子任务</label>
            <div className="space-y-2">
              {subItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2 rounded-md border bg-muted/50"
                >
                  <Checkbox
                    checked={item.status === 'done'}
                    onCheckedChange={() => handleToggleSubItem(item.id)}
                  />
                  <span
                    className={`flex-1 ${
                      item.status === 'done'
                        ? 'line-through text-muted-foreground'
                        : ''
                    }`}
                  >
                    {item.text}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleRemoveSubItem(item.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {/* 添加新子任务 */}
              <div className="flex gap-2">
                <Input
                  value={newSubItemText}
                  onChange={(e) => setNewSubItemText(e.target.value)}
                  placeholder="添加新的子任务..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubItem();
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleAddSubItem}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* 备注 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">备注</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="添加详细备注或总结..."
              rows={4}
            />
          </div>

          {/* 标签 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">标签</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:bg-muted rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
