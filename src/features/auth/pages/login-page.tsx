import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { ApiFieldErrors } from "@/lib/api/types";
import { login } from "../api";
import { useAuthStore } from "../store";
import { LoginField } from "../components/login-field";
import { toLoginErrorPresentation } from "../login-error-message";
import { toSafeRedirectPath } from "../safe-redirect";

interface LocationState {
  from?: { pathname: string };
}

/**
 * `/login` — a framed plate rather than a floating card: a hairline frame
 * with corner ticks holding the form at arm's length.
 *
 * Visual treatment lives in ../login.css; the field control and error-copy
 * mapping are their own modules, leaving this file the form's behaviour.
 */
export function LoginPage() {
  const status = useAuthStore((s) => s.status);
  const sessionNotice = useAuthStore((s) => s.sessionNotice);
  const setSessionNotice = useAuthStore((s) => s.setSessionNotice);
  const setAuthed = useAuthStore((s) => s.setAuthed);
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ApiFieldErrors>({});
  const [formAlert, setFormAlert] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: ({ token, user }) => {
      setAuthed(token, user);
      // Role routing belongs to RequirePlatformAdmin, so exactly one place
      // decides who gets inside the app shell.
      // Narrowed to an in-app path — `from` comes from the URL and is
      // attacker-influenceable (see safe-redirect.ts).
      const from = toSafeRedirectPath(
        (location.state as LocationState | null)?.from?.pathname,
      );
      navigate(from, { replace: true });
    },
    onError: (error: unknown) => {
      // Failure-mode copy lives in ../login-error-message.ts.
      const { fieldErrors, alert, cooldown } = toLoginErrorPresentation(error);
      setFieldErrors(fieldErrors);
      setFormAlert(alert);
      setCooldown(cooldown);
    },
  });

  // Already signed in — don't show the login form at all.
  if (status === "authed") {
    return <Navigate to="/app" replace />;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormAlert(null);

    const errors: ApiFieldErrors = {};
    if (!email.trim()) errors.email = ["Email is required."];
    if (!password) errors.password = ["Password is required."];
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    mutation.mutate({ email, password });
  }

  const submitDisabled = mutation.isPending || cooldown > 0;

  return (
    <div className="login-canvas flex min-h-svh items-center justify-center px-5 py-10">
      <div className="vault-frame relative w-full max-w-[26.5rem] rounded-[0.9rem] p-2.5">
        <VaultCornerTicks />

        <section className="vault-plate relative overflow-hidden rounded-[0.55rem] bg-card">
          <div className="absolute right-2 top-2 [&_button]:size-8 [&_button]:cursor-pointer [&_svg]:size-4 [&_button]:text-muted-foreground/60 [&_button:hover]:text-foreground">
            <ThemeToggle />
          </div>

          <div className="px-8 pb-9 pt-9">
            <LoginMasthead />

            {sessionNotice && (
              <div
                role="status"
                className="mt-6 flex items-start justify-between gap-3 rounded-md border border-warning/35 bg-warning/8 py-2.5 pl-3 pr-2"
              >
                <span className="text-[0.8125rem] leading-snug text-foreground/90">
                  {sessionNotice}
                </span>
                <button
                  type="button"
                  onClick={() => setSessionNotice(null)}
                  aria-label="Dismiss"
                  className="-mt-0.5 grid size-6 shrink-0 place-items-center rounded-sm text-sm leading-none text-muted-foreground transition-colors hover:bg-foreground/6 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  ✕
                </button>
              </div>
            )}

            {formAlert && <FormAlert message={formAlert} />}

            <div aria-hidden="true" className="vault-rule mt-6" />

            <form className="mt-7 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
              <LoginField
                label="Email"
                type="email"
                autoComplete="username"
                placeholder="you@gasa.com"
                value={email}
                onChange={setEmail}
                errors={fieldErrors.email}
              />

              <LoginField
                label="Password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={setPassword}
                errors={fieldErrors.password}
                revealable
              />

              <button
                type="submit"
                disabled={submitDisabled}
                className="login-submit mt-2 inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-[0.375rem] text-[0.8125rem] font-semibold tracking-[0.02em] text-primary-foreground transition-[filter,transform,box-shadow,opacity] hover:not-disabled:brightness-110 active:not-disabled:translate-y-px disabled:cursor-not-allowed disabled:bg-primary disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {mutation.isPending && (
                  // Pending only: a spinner beside a cooldown would imply work.
                  <span
                    aria-hidden="true"
                    className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70"
                  />
                )}
                {cooldown > 0
                  ? `Try again in ${cooldown}s`
                  : mutation.isPending
                    ? "Signing in…"
                    : "Sign in"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

/** Two short rules meeting at each corner of the registration frame. */
function VaultCornerTicks() {
  return (
    <>
      <span
        aria-hidden="true"
        className="vault-tick absolute -left-px -top-px border-l border-t rounded-tl-[0.9rem]"
      />
      <span
        aria-hidden="true"
        className="vault-tick absolute -right-px -top-px border-r border-t rounded-tr-[0.9rem]"
      />
      <span
        aria-hidden="true"
        className="vault-tick absolute -bottom-px -left-px border-b border-l rounded-bl-[0.9rem]"
      />
      <span
        aria-hidden="true"
        className="vault-tick absolute -bottom-px -right-px border-b border-r rounded-br-[0.9rem]"
      />
    </>
  );
}

/**
 * Mark, action, description — three registers so the group reads as a
 * masthead rather than three equal lines. The mark sits between two short
 * rule stubs; full-width rules would read as a divider.
 */
function LoginMasthead() {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-4">
        <span aria-hidden="true" className="vault-rule h-px w-10" />
        <p className="font-mono text-[1.5rem] font-bold uppercase leading-none tracking-[0.22em] text-foreground">
          {/* Optical centring: wide tracking adds a trailing space. */}
          <span className="-mr-[0.22em]">Gasa</span>
        </p>
        <span aria-hidden="true" className="vault-rule h-px w-10" />
      </div>
      <h1 className="mt-3 text-[1rem] font-semibold leading-none tracking-[-0.01em] text-foreground">
        Sign in
      </h1>
      <p className="mt-2.5 text-[0.78125rem] leading-relaxed text-muted-foreground/85">
        Operations console for GASA staff.
      </p>
    </div>
  );
}

/** An icon as well as colour — colour alone is what a colour-blind operator
 *  can miss, and this is the message explaining why they cannot get in. */
function FormAlert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mt-6 flex items-start gap-2.5 rounded-md border border-destructive/35 bg-destructive/8 px-3 py-2.5"
    >
      <span
        aria-hidden="true"
        className="mt-px grid size-4 shrink-0 place-items-center rounded-full bg-destructive text-[0.625rem] font-bold leading-none text-destructive-foreground"
      >
        !
      </span>
      <p className="text-[0.8125rem] leading-snug text-destructive">{message}</p>
    </div>
  );
}
