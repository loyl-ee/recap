"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  getRmTemplates,
  getTemplateQuestionsList,
  addQuestion,
  deleteQuestion,
  createTemplate,
  getRmPromptRules,
  savePromptRule,
  deletePromptRule,
} from "@/app/actions/rm";

type Store = { id: string; name: string };
type Template = {
  id: string;
  name: string;
  templateType: string;
  storeId: string | null;
  smId: string | null;
  active: boolean;
};
type Question = {
  id: string;
  questionText: string;
  sortOrder: number;
  required: boolean;
};
type Rule = { id: string; ruleType: string; value: string };

export function QuestionBuilderModal({
  rmId,
  stores,
}: {
  rmId: string;
  stores: Store[];
}) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [questions, setQuestions] = useState<Question[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newRuleValue, setNewRuleValue] = useState("");
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateStore, setNewTemplateStore] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  async function loadData() {
    const [t, r] = await Promise.all([
      getRmTemplates(rmId),
      getRmPromptRules(rmId),
    ]);
    setTemplates(t as Template[]);
    setRules(r as Rule[]);
    if (t.length > 0 && !selectedTemplate) {
      selectTemplate(t[0] as Template);
    }
  }

  async function selectTemplate(t: Template) {
    setSelectedTemplate(t);
    const q = await getTemplateQuestionsList(t.id);
    setQuestions(q as Question[]);
  }

  function handleAddQuestion() {
    if (!newQuestion.trim() || !selectedTemplate) return;
    startTransition(async () => {
      await addQuestion({
        templateId: selectedTemplate.id,
        questionText: newQuestion.trim(),
        questionType: "text",
        sortOrder: questions.length + 1,
        required: true,
      });
      setNewQuestion("");
      const q = await getTemplateQuestionsList(selectedTemplate.id);
      setQuestions(q as Question[]);
    });
  }

  function handleDeleteQuestion(questionId: string) {
    startTransition(async () => {
      await deleteQuestion(questionId);
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    });
  }

  function handleCreateTemplate() {
    if (!newTemplateName.trim()) return;
    startTransition(async () => {
      const created = await createTemplate({
        name: newTemplateName.trim(),
        templateType: newTemplateStore ? "store_specific" : "standard",
        rmId,
        storeId: newTemplateStore || undefined,
      });
      setNewTemplateName("");
      setNewTemplateStore("");
      const t = await getRmTemplates(rmId);
      setTemplates(t as Template[]);
      selectTemplate(created as Template);
    });
  }

  function handleAddRule() {
    if (!newRuleValue.trim()) return;
    startTransition(async () => {
      await savePromptRule({ rmId, ruleType: "theme", value: newRuleValue.trim() });
      setNewRuleValue("");
      const r = await getRmPromptRules(rmId);
      setRules(r as Rule[]);
    });
  }

  function handleDeleteRule(ruleId: string) {
    startTransition(async () => {
      await deletePromptRule(ruleId);
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="outline" size="sm" className="h-9 font-medium" />}
      >
        Questions
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Question Builder</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Template selector */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Templates
            </Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {templates.map((t) => (
                <Button
                  key={t.id}
                  variant={
                    selectedTemplate?.id === t.id ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => selectTemplate(t)}
                  className="text-xs h-8"
                >
                  {t.name}
                  {t.templateType !== "standard" && (
                    <Badge variant="secondary" className="ml-1.5 text-[10px]">
                      store
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Create new template */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label className="text-xs">New template name</Label>
              <Input
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Template name..."
                className="h-9 text-sm"
              />
            </div>
            <div className="w-48">
              <Label className="text-xs">Store (optional)</Label>
              <select
                value={newTemplateStore}
                onChange={(e) => setNewTemplateStore(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">All stores (standard)</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <Button
              size="sm"
              onClick={handleCreateTemplate}
              disabled={isPending || !newTemplateName.trim()}
              className="h-9"
            >
              Create
            </Button>
          </div>

          <Separator />

          {/* Questions for selected template */}
          {selectedTemplate && (
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Questions in &quot;{selectedTemplate.name}&quot;
              </Label>
              <div className="mt-2 space-y-2">
                {questions.map((q, i) => (
                  <div
                    key={q.id}
                    className="flex items-start gap-2 rounded-lg border border-border px-3 py-2"
                  >
                    <span className="text-xs text-muted-foreground mt-0.5 shrink-0">
                      {i + 1}.
                    </span>
                    <p className="text-sm flex-1">{q.questionText}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteQuestion(q.id)}
                      disabled={isPending}
                      className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                {questions.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No questions yet.
                  </p>
                )}
              </div>

              <div className="flex gap-2 mt-3">
                <Textarea
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Add a new question..."
                  rows={2}
                  className="text-sm resize-none"
                />
                <Button
                  onClick={handleAddQuestion}
                  disabled={isPending || !newQuestion.trim()}
                  className="h-auto self-end"
                >
                  Add
                </Button>
              </div>
            </div>
          )}

          <Separator />

          {/* Prompt rules / themes */}
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Themes &amp; Direction
            </Label>
            <p className="text-xs text-muted-foreground mt-1 mb-3">
              These are embedded into every SM&apos;s generated prompt.
            </p>
            <div className="space-y-2">
              {rules.map((r) => (
                <div
                  key={r.id}
                  className="flex items-start gap-2 rounded-lg border border-border px-3 py-2"
                >
                  <Badge variant="secondary" className="text-[10px] mt-0.5 shrink-0">
                    {r.ruleType}
                  </Badge>
                  <p className="text-sm flex-1">{r.value}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRule(r.id)}
                    disabled={isPending}
                    className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <Input
                value={newRuleValue}
                onChange={(e) => setNewRuleValue(e.target.value)}
                placeholder="Add a theme or direction..."
                className="h-9 text-sm"
              />
              <Button
                size="sm"
                onClick={handleAddRule}
                disabled={isPending || !newRuleValue.trim()}
                className="h-9"
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
