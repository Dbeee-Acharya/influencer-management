import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2, Pencil, Plus, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_auth/staff")({
  beforeLoad: () => {
    const token = localStorage.getItem("token");
    if (!token) throw redirect({ to: "/login" });
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.role !== "admin") throw redirect({ to: "/" });
    } catch (e) {
      if (e && typeof e === "object" && "to" in e) throw e;
      throw redirect({ to: "/" });
    }
  },
  component: StaffPage,
});

// ── Types ──────────────────────────────────────────────────────────────────────

interface StaffMember {
  id: number;
  name: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  createdAt: string;
}

type Role = "admin" | "editor" | "viewer";

// ── Role badge ─────────────────────────────────────────────────────────────────

const roleVariant: Record<Role, "default" | "secondary" | "outline"> = {
  admin: "default",
  editor: "secondary",
  viewer: "outline",
};

function RoleBadge({ role }: { role: Role }) {
  return (
    <Badge variant={roleVariant[role]} className="capitalize">
      {role}
    </Badge>
  );
}

// ── Staff Form Modal ───────────────────────────────────────────────────────────

interface StaffFormProps {
  open: boolean;
  onClose: () => void;
  member?: StaffMember; // undefined = create mode
}

function StaffFormModal({ open, onClose, member }: StaffFormProps) {
  const queryClient = useQueryClient();
  const isEdit = !!member;

  const [name, setName] = useState(member?.name ?? "");
  const [email, setEmail] = useState(member?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(member?.role ?? "viewer");

  // Reset on open
  function resetAndClose() {
    setName(member?.name ?? "");
    setEmail(member?.email ?? "");
    setPassword("");
    setRole(member?.role ?? "viewer");
    onClose();
  }

  const createMutation = useMutation({
    mutationFn: (body: { name: string; email: string; password: string; role: Role }) =>
      api.post("/auth/staff", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff member created");
      resetAndClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error ?? "Failed to create staff");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (body: { name: string; email: string; role: Role; password?: string }) =>
      api.patch(`/staff/${member!.id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff member updated");
      resetAndClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error ?? "Failed to update staff");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    if (isEdit) {
      const body: { name: string; email: string; role: Role; password?: string } = {
        name: name.trim(),
        email: email.trim(),
        role,
      };
      if (password.trim()) body.password = password.trim();
      updateMutation.mutate(body);
    } else {
      if (!password.trim()) return;
      createMutation.mutate({ name: name.trim(), email: email.trim(), password: password.trim(), role });
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && resetAndClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Staff Member" : "Add Staff Member"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="sf-name">Name</Label>
            <Input
              id="sf-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sf-email">Email</Label>
            <Input
              id="sf-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sf-password">
              {isEdit ? "New password" : "Password"}
              {isEdit && (
                <span className="ml-1 text-xs text-muted-foreground">(leave blank to keep current)</span>
              )}
            </Label>
            <Input
              id="sf-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEdit ? "Leave blank to keep current" : "Password"}
              required={!isEdit}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sf-role">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger id="sf-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={resetAndClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : isEdit ? "Save changes" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete confirmation ────────────────────────────────────────────────────────

interface DeleteDialogProps {
  member: StaffMember | null;
  onClose: () => void;
}

function DeleteDialog({ member, onClose }: DeleteDialogProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/staff/${member!.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff member removed");
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error ?? "Failed to delete");
    },
  });

  return (
    <Dialog open={!!member} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Remove staff member?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{member?.name}</span> will lose access
          immediately. This cannot be undone.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={deleteMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Removing…" : "Remove"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

function StaffPage() {
  const { staff: me } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | undefined>();
  const [deleting, setDeleting] = useState<StaffMember | null>(null);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const { data } = await api.get<StaffMember[]>("/staff");
      return data;
    },
  });

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }

  function openEdit(member: StaffMember) {
    setEditing(member);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Staff</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage who has access to the platform.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add staff
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 rounded bg-muted animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : members.map((member) => {
                  const isSelf = String(member.id) === me?.sub;
                  return (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.name}
                        {isSelf && (
                          <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{member.email}</TableCell>
                      <TableCell>
                        <RoleBadge role={member.role} />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openEdit(member)}
                            aria-label="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => setDeleting(member)}
                            disabled={isSelf}
                            aria-label="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}

            {!isLoading && members.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <ShieldAlert className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No staff members yet.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modals */}
      <StaffFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        member={editing}
      />
      <DeleteDialog member={deleting} onClose={() => setDeleting(null)} />
    </div>
  );
}
