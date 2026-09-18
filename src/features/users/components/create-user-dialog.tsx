import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import type { ApiFieldErrors } from "@/lib/api/types";
import { useCreateUser } from "../use-users";
import { PORTAL_ROLES, ROLE_LABEL, type PortalRole } from "../types";

/**
 * Creates a user and sends them an invite.
 *
 * There is deliberately NO password field: the API has no endpoint that
 * sets one, so the invite is the only way a password is established and
 * an admin never learns another user's credentials.
 */
export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<PortalRole>("merchant");
  const [fieldErrors, setFieldErrors] = useState<ApiFieldErrors>({});

  const createUser = useCreateUser();

  function reset() {
    setName("");
    setEmail("");
    setRole("merchant");
    setFieldErrors({});
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});

    createUser.mutate(
      { name, email, role },
      {
        onSuccess: () => {
          setOpen(false);
          reset();
        },
        onError: (error) => {
          // A 422 marks up the offending inputs; every other failure is
          // already surfaced as a toast by the mutation itself.
          if (error instanceof ApiError && error.status === 422 && error.errors) {
            setFieldErrors(error.errors);
          }
        },
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">Add user</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[26rem]">
        <form onSubmit={handleSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>Add a user</DialogTitle>
            <DialogDescription>
              They receive an invite to set their own password. No password is set here.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 flex flex-col gap-4">
            <Field label="Name" error={fieldErrors.name?.[0]}>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
                placeholder="Jane Dela Cruz"
              />
            </Field>

            <Field label="Email" error={fieldErrors.email?.[0]}>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                placeholder="jane@example.com"
              />
            </Field>

            <Field label="Role" error={fieldErrors.role?.[0]}>
              <Select value={role} onValueChange={(value) => setRole(value as PortalRole)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PORTAL_ROLES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {ROLE_LABEL[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createUser.isPending}>
              {createUser.isPending ? "Inviting…" : "Send invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Label above, error on the same row — the field height never changes. */
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <Label className="console-label text-muted-foreground">{label}</Label>
        {error && (
          <span className="text-[0.6875rem] leading-none text-destructive">{error}</span>
        )}
      </div>
      {children}
    </div>
  );
}
