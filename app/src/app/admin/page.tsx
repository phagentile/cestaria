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
  DialogTrigger,
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
import type { UserRole } from "@/types";

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const store = useAdminStore();

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
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-lg font-bold">Cadastros Mestres</h1>
      </header>

      <main className="max-w-5xl mx-auto p-4">
        <Tabs defaultValue="clubs" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="confederations">Confed.</TabsTrigger>
            <TabsTrigger value="federations">Federacoes</TabsTrigger>
            <TabsTrigger value="clubs">Clubes</TabsTrigger>
            <TabsTrigger value="referees">Arbitros</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
          </TabsList>

          {/* Confederations */}
          <TabsContent value="confederations">
            <CrudSection
              title="Confederacoes"
              items={store.confederations}
              columns={["name", "acronym", "country"]}
              columnLabels={["Nome", "Sigla", "Pais"]}
              fields={[
                { key: "name", label: "Nome", required: true },
                { key: "acronym", label: "Sigla", required: true },
                { key: "country", label: "Pais", required: true },
              ]}
              onAdd={(data) => store.addConfederation(data as never)}
              onDelete={(id) => store.deleteConfederation(id)}
            />
          </TabsContent>

          {/* Federations */}
          <TabsContent value="federations">
            <CrudSection
              title="Federacoes"
              items={store.federations}
              columns={["name", "acronym", "region"]}
              columnLabels={["Nome", "Sigla", "Regiao"]}
              fields={[
                { key: "name", label: "Nome", required: true },
                { key: "acronym", label: "Sigla", required: true },
                { key: "region", label: "Regiao", required: true },
                {
                  key: "confederationId",
                  label: "Confederacao",
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
              title="Clubes"
              items={store.clubs}
              columns={["name", "acronym", "city"]}
              columnLabels={["Nome", "Sigla", "Cidade"]}
              fields={[
                { key: "name", label: "Nome", required: true },
                { key: "acronym", label: "Sigla", required: true },
                { key: "city", label: "Cidade", required: true },
                {
                  key: "federationId",
                  label: "Federacao",
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
              title="Arbitros"
              items={store.referees}
              columns={["name", "usualRole"]}
              columnLabels={["Nome", "Funcao"]}
              fields={[
                { key: "name", label: "Nome", required: true },
                {
                  key: "usualRole",
                  label: "Funcao",
                  type: "select",
                  options: [
                    { value: "central", label: "Central" },
                    { value: "ar", label: "Assistente" },
                    { value: "tmo", label: "TMO" },
                    { value: "fourth", label: "4o Arbitro" },
                  ],
                  required: true,
                },
                {
                  key: "federationId",
                  label: "Federacao",
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
              title="Categorias"
              items={store.categories}
              columns={["name"]}
              columnLabels={["Nome"]}
              fields={[
                { key: "name", label: "Nome", required: true },
                { key: "description", label: "Descricao" },
              ]}
              onAdd={(data) => store.addCategory(data as never)}
              onDelete={(id) => store.deleteCategory(id)}
            />
          </TabsContent>

          {/* Users */}
          <TabsContent value="users">
            <CrudSection
              title="Usuarios"
              items={store.users.map((u) => ({
                ...u,
                roleLabel: u.role === "gestor" ? "Gestor" : "4o Arbitro",
              }))}
              columns={["name", "email", "roleLabel"]}
              columnLabels={["Nome", "Email", "Perfil"]}
              fields={[
                { key: "name", label: "Nome", required: true },
                { key: "email", label: "Email", required: true },
                {
                  key: "role",
                  label: "Perfil",
                  type: "select",
                  options: [
                    { value: "gestor", label: "Gestor" },
                    { value: "quarto_arbitro", label: "4o Arbitro" },
                  ],
                  required: true,
                },
              ]}
              onAdd={(data) => store.addUser(data as never)}
              onDelete={(id) => store.deleteUser(id)}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
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
