"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useAdminStore } from "@/stores/admin-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import { useI18n } from "@/lib/i18n";
import type { UserRole, EntityLevel } from "@/types";

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const store = useAdminStore();
  const { t } = useI18n();

  useEffect(() => {
    if (!user || user.role !== "gestor") {
      router.push("/dashboard");
      return;
    }
    store.loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router]);

  if (!user || user.role !== "gestor") return null;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="bg-[var(--card)] border-b border-[var(--border)] px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-lg font-bold flex-1">{t("app.name")} — {t("admin.title")}</h1>
        <LocaleToggle />
        <ThemeToggle />
      </header>

      <main className="max-w-5xl mx-auto p-4">
        <Tabs defaultValue="clubs" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="confederations">{t("admin.confederations")}</TabsTrigger>
            <TabsTrigger value="federations">{t("admin.federations")}</TabsTrigger>
            <TabsTrigger value="clubs">{t("admin.clubs")}</TabsTrigger>
            <TabsTrigger value="referees">{t("admin.referees")}</TabsTrigger>
            <TabsTrigger value="categories">{t("admin.categories")}</TabsTrigger>
            <TabsTrigger value="users">{t("admin.users")}</TabsTrigger>
            <TabsTrigger value="entities">{t("admin.entities")}</TabsTrigger>
          </TabsList>

          {/* Confederations */}
          <TabsContent value="confederations">
            <CrudSection
              title={t("admin.confederations")}
              items={store.confederations}
              columns={["name", "acronym", "country"]}
              columnLabels={[t("ui.name"), t("ui.acronym"), t("entity.country")]}
              fields={[
                { key: "name", label: t("ui.name"), required: true },
                { key: "acronym", label: t("ui.acronym"), required: true },
                { key: "country", label: t("entity.country"), required: true },
              ]}
              onAdd={(data) => store.addConfederation(data as never)}
              onDelete={(id) => store.deleteConfederation(id)}
            />
          </TabsContent>

          {/* Federations */}
          <TabsContent value="federations">
            <CrudSection
              title={t("admin.federations")}
              items={store.federations}
              columns={["name", "acronym", "region"]}
              columnLabels={[t("ui.name"), t("ui.acronym"), t("entity.region")]}
              fields={[
                { key: "name", label: t("ui.name"), required: true },
                { key: "acronym", label: t("ui.acronym"), required: true },
                { key: "region", label: t("entity.region"), required: true },
                {
                  key: "confederationId",
                  label: t("admin.confederations"),
                  type: "select",
                  options: store.confederations.map((c) => ({
                    value: c.id,
                    label: c.name,
                  })),
                  required: true,
                },
              ]}
              onAdd={(data) => store.addFederation(data as never)}
              onDelete={(id) => store.deleteFederation(id)}
            />
          </TabsContent>

          {/* Clubs */}
          <TabsContent value="clubs">
            <CrudSection
              title={t("admin.clubs")}
              items={store.clubs}
              columns={["name", "acronym", "city"]}
              columnLabels={[t("ui.name"), t("ui.acronym"), "Cidade"]}
              fields={[
                { key: "name", label: t("ui.name"), required: true },
                { key: "acronym", label: t("ui.acronym"), required: true },
                { key: "city", label: "Cidade", required: true },
                {
                  key: "federationId",
                  label: t("admin.federations"),
                  type: "select",
                  options: store.federations.map((f) => ({
                    value: f.id,
                    label: f.name,
                  })),
                  required: true,
                },
                { key: "primaryColor", label: "Cor primaria", required: true },
                { key: "secondaryColor", label: "Cor secundaria", required: true },
              ]}
              onAdd={(data) => store.addClub(data as never)}
              onDelete={(id) => store.deleteClub(id)}
            />
          </TabsContent>

          {/* Referees */}
          <TabsContent value="referees">
            <CrudSection
              title={t("admin.referees")}
              items={store.referees}
              columns={["name", "usualRole"]}
              columnLabels={[t("ui.name"), t("admin.usual_role")]}
              fields={[
                { key: "name", label: t("ui.name"), required: true },
                {
                  key: "usualRole",
                  label: t("admin.usual_role"),
                  type: "select",
                  options: [
                    { value: "central", label: t("ref.central") },
                    { value: "ar", label: t("ref.ar1") },
                    { value: "tmo", label: "TMO" },
                    { value: "fourth", label: t("ref.fourth_official") },
                  ],
                  required: true,
                },
                {
                  key: "federationId",
                  label: t("admin.federations"),
                  type: "select",
                  options: store.federations.map((f) => ({
                    value: f.id,
                    label: f.name,
                  })),
                  required: true,
                },
              ]}
              onAdd={(data) => store.addReferee(data as never)}
              onDelete={(id) => store.deleteReferee(id)}
            />
          </TabsContent>

          {/* Categories */}
          <TabsContent value="categories">
            <CrudSection
              title={t("admin.categories")}
              items={store.categories}
              columns={["name"]}
              columnLabels={[t("ui.name")]}
              fields={[
                { key: "name", label: t("ui.name"), required: true },
                { key: "description", label: t("admin.description") },
              ]}
              onAdd={(data) => store.addCategory(data as never)}
              onDelete={(id) => store.deleteCategory(id)}
            />
          </TabsContent>

          {/* Users */}
          <TabsContent value="users">
            <CrudSection
              title={t("admin.users")}
              items={store.users.map((u) => ({
                ...u,
                roleLabel: t("role." + u.role),
              }))}
              columns={["name", "email", "roleLabel"]}
              columnLabels={[t("ui.name"), t("auth.email"), t("admin.user_role")]}
              fields={[
                { key: "name", label: t("ui.name"), required: true },
                { key: "email", label: t("auth.email"), required: true },
                {
                  key: "role",
                  label: t("admin.user_role"),
                  type: "select",
                  options: [
                    { value: "gestor", label: t("role.gestor") },
                    { value: "quarto_arbitro", label: t("role.quarto_arbitro") },
                  ],
                  required: true,
                },
              ]}
              onAdd={(data) => store.addUser(data as never)}
              onDelete={(id) => store.deleteUser(id)}
            />
          </TabsContent>

          {/* Organizing Entities */}
          <TabsContent value="entities">
            <EntitiesSection
              t={t}
              items={store.organizingEntities}
              onAdd={(data) => store.addOrganizingEntity(data as never)}
              onDelete={(id) => store.deleteOrganizingEntity(id)}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// --- Entities Section ---

interface EntitiesSectionProps {
  t: (key: string) => string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[];
  onAdd: (data: Record<string, string>) => Promise<string | void>;
  onDelete: (id: string) => Promise<void>;
}

function EntitiesSection({ t, items, onAdd, onDelete }: EntitiesSectionProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [acronym, setAcronym] = useState("");
  const [level, setLevel] = useState<EntityLevel>("national");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");

  const handleAdd = async () => {
    if (!name || !acronym || !level) return;
    await onAdd({ name, acronym, level, country, region });
    setName(""); setAcronym(""); setLevel("national"); setCountry(""); setRegion("");
    setOpen(false);
  };

  const levelOptions: { value: EntityLevel; labelKey: string }[] = [
    { value: "world", labelKey: "entity.world" },
    { value: "continental", labelKey: "entity.continental" },
    { value: "national", labelKey: "entity.national" },
    { value: "state", labelKey: "entity.state" },
    { value: "regional", labelKey: "entity.regional" },
  ];

  const LEVEL_LABEL: Record<EntityLevel, string> = {
    world: t("entity.world"),
    continental: t("entity.continental"),
    national: t("entity.national"),
    state: t("entity.state"),
    regional: t("entity.regional"),
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("admin.entities")}</CardTitle>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          {t("ui.add")}
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("admin.entities")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <Label>{t("ui.name")} *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("ui.name")} />
              </div>
              <div className="space-y-1">
                <Label>{t("ui.acronym")} *</Label>
                <Input value={acronym} onChange={(e) => setAcronym(e.target.value)} placeholder={t("ui.acronym")} />
              </div>
              <div className="space-y-1">
                <Label>{t("entity.level")} *</Label>
                <Select value={level} onValueChange={(v) => setLevel(v as EntityLevel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {levelOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{t(o.labelKey)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t("entity.country")}</Label>
                <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder={t("entity.country")} />
              </div>
              <div className="space-y-1">
                <Label>{t("entity.region")}</Label>
                <Input value={region} onChange={(e) => setRegion(e.target.value)} placeholder={t("entity.region")} />
              </div>
              <Button className="w-full mt-2" onClick={handleAdd}>
                {t("ui.save")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            {t("ui.no_results")}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("ui.name")}</TableHead>
                <TableHead>{t("ui.acronym")}</TableHead>
                <TableHead>{t("entity.level")}</TableHead>
                <TableHead>{t("entity.country")}</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id as string}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.acronym}</TableCell>
                  <TableCell>{LEVEL_LABEL[item.level as EntityLevel] ?? item.level}</TableCell>
                  <TableCell>{item.country ?? "—"}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(item.id as string)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// --- Generic CRUD Section Component ---

interface FieldDef {
  key: string;
  label: string;
  required?: boolean;
  type?: "text" | "select";
  options?: { value: string; label: string }[];
}

interface CrudSectionProps {
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[];
  columns: string[];
  columnLabels: string[];
  fields: FieldDef[];
  onAdd: (data: Record<string, string>) => Promise<string | void>;
  onDelete: (id: string) => Promise<void>;
}

function CrudSection({
  title,
  items,
  columns,
  columnLabels,
  fields,
  onAdd,
  onDelete,
}: CrudSectionProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleAdd = async () => {
    // Check required
    for (const f of fields) {
      if (f.required && !formData[f.key]) return;
    }
    await onAdd(formData);
    setFormData({});
    setOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Adicionar
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo {title.slice(0, -1)}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              {fields.map((f) => (
                <div key={f.key} className="space-y-1">
                  <Label>{f.label}{f.required && " *"}</Label>
                  {f.type === "select" ? (
                    <Select
                      value={formData[f.key] ?? ""}
                      onValueChange={(v) =>
                        setFormData((d) => ({ ...d, [f.key]: v ?? "" }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Selecione ${f.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {f.options?.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={formData[f.key] ?? ""}
                      onChange={(e) =>
                        setFormData((d) => ({ ...d, [f.key]: e.target.value }))
                      }
                      placeholder={f.label}
                    />
                  )}
                </div>
              ))}
              <Button className="w-full mt-2" onClick={handleAdd}>
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            Nenhum registro.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columnLabels.map((l) => (
                  <TableHead key={l}>{l}</TableHead>
                ))}
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id as string}>
                  {columns.map((col) => (
                    <TableCell key={col}>
                      {String(item[col] ?? "—")}
                    </TableCell>
                  ))}
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(item.id as string)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// Suppress unused type import warning
type _UserRole = UserRole;
